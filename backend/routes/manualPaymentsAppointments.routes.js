import express from "express";
import db from "../database/index.js";
import { uploadArray } from "../utils/manageFiles.js";
import { createNotification } from "../utils/notificationHelper.js";
import { TZDate } from "@date-fns/tz";
import logger from "../utils/logger.js";
import { sendBrevoEmail } from "../utils/emailSender.js";
import { ensureMeetLinkForAppointment } from "../utils/meetLinkService.js";
import { ensureZoomLinkForAppointment } from "../utils/zoomLinkService.js";
import { assertUserCanBook } from "../utils/bookingRules.js";

const router = express.Router();
router.use(express.json());

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ZONE = process.env.ZONE_TIME;

const TEMPLATE_CONFIRMACION_MANUAL = parseInt(process.env.BREVO_TEMPLATE_CONFIRMACION_MANUAL);
const TEMPLATE_PAGO_EXITOSO = parseInt(process.env.BREVO_TEMPLATE_PAGO_EXITOSO);

// ---------------------------------------------------------
// POST: Crear nuevo pago manual
// ---------------------------------------------------------
router.post("/", uploadArray("paymentImage", 1), async (req, res) => {
	console.log("🚀 INICIANDO PROCESO DE PAGO MANUAL");
	const transaction = await db.sequelize.transaction();

	try {
		const {
			amount,
			reference,
			client_name,
			client_email,
			client_phone,
			notes,
			user_id,
			appointment_id,
			transactionDate,
			meetingPlatformId,
		} = req.body;

		const files = req.files;

		// 1. Validaciones iniciales (Dentro de transacción para consistencia)
		const user = await db.User.findOne({ where: { cleark_id: user_id }, transaction });
		const appointment = await db.Appointment.findByPk(appointment_id, { transaction });
		const paymentMethod = await db.PaymentsMethods.findOne({ where: { name: "Pago Externo" }, transaction });

		if (!appointment) {
			await transaction.rollback();
			return res.status(404).json({ status: "error", message: "Appointment not found" });
		}

		if (appointment.status === "reservado" || appointment.status === "pendiente_pago") {
			await transaction.rollback();
			return res.status(400).json({
				status: "error",
				code: "APPOINTMENT_ALREADY_BOOKED",
				message: "Esta cita ya está siendo reservada por otro usuario. Por favor selecciona otra cita.",
			});
		}

		if (!user) {
			await transaction.rollback();
			return res.status(404).json({ status: "error", message: "User not found" });
		}

		// 2. Regla de negocio: 1 cita activa
		try {
			await assertUserCanBook(user.id);
		} catch (e) {
			if (e?.code === "USER_HAS_ACTIVE_APPOINTMENT") {
				await transaction.rollback();
				return res.status(400).json({
					status: "error",
					code: e.code,
					message: "Ya tienes una cita activa.",
					activeAppointment: e.details,
				});
			}
			throw e;
		}

		// 3. Referencia única
		if (reference) {
			const existingPayment = await db.PaymentsAppointments.findOne({ where: { reference }, transaction });
			if (existingPayment) {
				await transaction.rollback();
				return res.status(400).json({
					status: "error",
					code: "DUPLICATE_REFERENCE",
					message: "Referencia ya utilizada.",
				});
			}
		}

		// 4. Crear Registro de Pago
		const paymentAppointment = await db.PaymentsAppointments.create(
			{
				paymentMethodId: paymentMethod.id,
				status: "pendiente",
				amount,
				reference,
				client_name,
				client_email,
				client_phone,
				notes,
				user_id: user.id,
				is_approved: null,
				currency: "USD",
				appointment_id: appointment_id ? parseInt(appointment_id) : null,
				transactionDate: transactionDate
					? new TZDate(transactionDate, ZONE).internal
					: new TZDate(new Date(), ZONE).internal,
				createdAt: new TZDate(new Date(), ZONE).internal,
				updatedAt: new TZDate(new Date(), ZONE).internal,
			},
			{ transaction }
		);

		// 5. Guardar Imagen
		await db.PaymentImages.create(
			{
				payment_id: paymentAppointment.id,
				file_path: files?.[0] ? `uploads/${files[0].filename}` : null,
				file_name: files?.[0] ? files[0].originalname : null,
				uploaded_by: 1,
				is_active: true,
				created_at: new TZDate(new Date(), ZONE).internal,
				uploaded_at: new TZDate(new Date(), ZONE).internal,
			},
			{ transaction }
		);

		// 6. Actualizar Cita a pendiente_pago
		await appointment.update(
			{
				status: "pendiente_pago",
				...(meetingPlatformId && { meetingPlatformId: parseInt(meetingPlatformId) }),
			},
			{ transaction }
		);

		// 7. Notificación al Admin
		const adminUser = await db.User.findOne({ where: { email: ADMIN_EMAIL }, transaction });

		let fechaFormateada = "N/D";
		if (appointment.day) {
			const fechaTz = new TZDate(appointment.day, ZONE);
			fechaFormateada = new Date(fechaTz.internal).toLocaleDateString("es-MX", {
				weekday: "long",
				day: "numeric",
				month: "long",
			});
			fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
		}

		await db.Notification.create(
			{
				title: "Nuevo pago pendiente",
				body: `Pago de ${amount}$ por ${client_name}`,
				type: "success",
				modalBody: `<b>Pago recibido para ${fechaFormateada}</b><br>Referencia: ${reference}`,
				user_id: adminUser?.id,
				payment_id: paymentAppointment.id,
			},
			{ transaction }
		);

		// 8. Email de confirmación de recepción (Opcional)
		try {
			if (TEMPLATE_CONFIRMACION_MANUAL && client_email) {
				await sendBrevoEmail(TEMPLATE_CONFIRMACION_MANUAL, client_email, {
					cliente_nombre: client_name,
					cita_fecha: fechaFormateada,
					cita_hora: `${appointment.start_time.slice(0, 5)} - ${appointment.end_time.slice(0, 5)}`,
					tipo_asesoria: "Asesoría Legal Online",
				});
			}
		} catch (e) {
			console.error("Error email 1:", e);
		}

		await transaction.commit();
		res.status(201).json({ status: "success", data: paymentAppointment });
	} catch (error) {
		await transaction.rollback();
		console.error("Error en POST pago:", error);
		res.status(500).json({ status: "error", message: error.message });
	}
});

// ---------------------------------------------------------
// PUT: Aprobar o Rechazar Pago
// ---------------------------------------------------------
router.put("/:id", async (req, res) => {
	console.log("|||||||||||| ACTUALIZANDO ESTADO DE PAGO ||||||||||||");
	const transaction = await db.sequelize.transaction();

	try {
		const { id } = req.params;

		// ✅ Log para confirmar exactamente qué manda el frontend
		const rawStatus = (req.body?.status ?? "").toString();
		console.log("PUT /payments/:id status recibido:", rawStatus, "type:", typeof rawStatus);

		// ✅ Normalización (tolerante a variantes)
		const normalizedRaw = rawStatus.trim().toLowerCase();

		const statusMap = {
			// completado
			completado: "completado",
			aprobado: "completado",
			success: "completado",
			succeeded: "completado",
			paid: "completado",

			// fallido / rechazado
			fallido: "fallido",
			rechazado: "fallido",
			rechazo: "fallido",
			declined: "fallido",
			failed: "fallido",
			rejected: "fallido",
			cancelado: "fallido",
			canceled: "fallido",
			cancelled: "fallido",
		};

		const status = statusMap[normalizedRaw];

		if (!status) {
			await transaction.rollback();
			return res.status(400).json({
				status: "error",
				message: `Status inválido: "${rawStatus}". Usa: completado | fallido (o sus variantes).`,
			});
		}

		// ✅ is_approved correcto
		const isApproved = status === "completado" ? true : status === "fallido" ? false : null;

		const paymentAppointment = await db.PaymentsAppointments.findByPk(id, { transaction });
		if (!paymentAppointment) {
			await transaction.rollback();
			return res.status(404).json({ status: "error", message: "Payment not found" });
		}

		// ✅ Actualizar pago (y updatedAt consistente)
		await paymentAppointment.update(
			{
				status,
				is_approved: isApproved,
				updatedAt: new TZDate(new Date(), ZONE).internal,
			},
			{ transaction }
		);

		// Para el background (solo en completado)
		let appointmentForBackground = null;

		// ✅ COMPLETADO => reservar cita
		if (status === "completado") {
			const appointment = await db.Appointment.findByPk(paymentAppointment.appointment_id, { transaction });

			if (appointment) {
				const timestamp = new Date().toISOString();
				console.log(`[${timestamp}] 📅 CITA ENCONTRADA:`, appointment.id);
				console.log(`[${timestamp}]    - meetingPlatformId:`, appointment.meetingPlatformId);
				console.log(`[${timestamp}]    - meeting_link actual:`, appointment.meeting_link);

				console.log(`[${timestamp}] ⏳ Actualizando estado de cita a 'reservado'...`);
				await appointment.update(
					{ status: "reservado", updatedAt: new TZDate(new Date(), ZONE).internal },
					{ transaction }
				);
				console.log(`[${timestamp}] ✅ Estado actualizado`);

				appointmentForBackground = appointment; // para uso posterior fuera de la transacción
			}
		}

		// ✅ FALLIDO => liberar cita
		if (status === "fallido") {
			const timestamp = new Date().toISOString();
			console.log(`[${timestamp}] ❌ Pago fallido, liberando cita ${paymentAppointment.appointment_id}`);

			const appointment = await db.Appointment.findByPk(paymentAppointment.appointment_id, { transaction });
			if (!appointment) {
				await transaction.rollback();
				return res.status(404).json({
					status: "error",
					message: "Appointment not found for this payment",
				});
			}

			// 🔥 Importante: limpiar campos que pueden afectar disponibilidad en tu UI
			await appointment.update(
				{
					status: "disponible",
					reservation: null,
					reservation_date: null,
					updatedAt: new TZDate(new Date(), ZONE).internal,
				},
				{ transaction }
			);

			console.log(`[${timestamp}] ✅ Cita ${appointment.id} liberada (disponible)`);
		}

		// ✅ Notificación al Usuario
		await db.Notification.create(
			{
				user_id: paymentAppointment.user_id,
				title: `Tu pago está ${status}`,
				body: `Tu pago ha sido actualizado a: ${status}.`,
				type: status === "completado" ? "success" : "error",
				payment_id: paymentAppointment.id,
				seen: false,
			},
			{ transaction }
		);

		await transaction.commit();

		// ✅ Responder al frontend
		res.status(200).json({ status: "success", data: paymentAppointment });

		// ⏳ Background SOLO si completado y hay cita
		if (status === "completado" && appointmentForBackground) {
			setImmediate(async () => {
				try {
					const timestamp = new Date().toISOString();

					// VOLVER A CONSULTAR LA CITA FUERA DE LA TRANSACCIÓN
					const freshAppointment = await db.Appointment.findByPk(appointmentForBackground.id);
					if (!freshAppointment) {
						console.error(`[${timestamp}] ❌ [BACKGROUND] No se encontró la cita al intentar generar link`);
						return;
					}

					let meetLink = freshAppointment.meeting_link;

					// GENERAR LINK SI NO EXISTE
					if (!meetLink || meetLink.trim() === "") {
						console.log(`[${timestamp}] 🔗 [BACKGROUND] GENERANDO LINK DE REUNIÓN...`);
						try {
							if (!freshAppointment.meetingPlatformId) {
								console.error("❌ ERROR: appointment.meetingPlatformId es NULL o undefined");
								throw new Error("No se ha seleccionado una plataforma de reunión");
							}

							console.log(`[${timestamp}] ⏳ Buscando plataforma ID: ${freshAppointment.meetingPlatformId}...`);
							const platform = await db.MeetingPlatforms.findByPk(freshAppointment.meetingPlatformId);
							console.log(`[${timestamp}]    - Plataforma encontrada:`, platform?.name || "NULL");

							if (!platform) throw new Error(`Plataforma no encontrada (ID: ${freshAppointment.meetingPlatformId})`);

							const platformName = (platform?.name || "").toLowerCase();
							console.log(`[${timestamp}]    - Nombre de plataforma:`, platformName);

							if (platformName.includes("zoom")) {
								console.log(`[${timestamp}]    🎦 [BACKGROUND] Generando link de Zoom...`);
								const zoom = await ensureZoomLinkForAppointment(freshAppointment.id);
								meetLink = zoom.link;
							} else {
								console.log(`[${timestamp}]    📹 [BACKGROUND] Generando link de Google Meet...`);
								const meet = await ensureMeetLinkForAppointment(freshAppointment.id);
								meetLink = meet.link;
							}

							console.log(`[${timestamp}] ⏳ [BACKGROUND] Guardando link en la BD...`);
							await freshAppointment.update({
								meeting_link: meetLink,
								updatedAt: new TZDate(new Date(), ZONE).internal,
							});
							console.log(`[${timestamp}] ✅ [BACKGROUND] Link guardado:`, meetLink);
						} catch (linkError) {
							console.error(`[${new Date().toISOString()}] ❌ [BACKGROUND] ERROR GENERANDO LINK:`, linkError.message);
							logger.error(`Error generando link de reunión en background: ${linkError.message}`);
						}
					} else {
						console.log(`[${timestamp}] ✅ [BACKGROUND] La cita ya tenía un link:`, meetLink);
					}

					// EMAIL DE PAGO EXITOSO
					try {
						const opciones = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
						const fCita = new TZDate(freshAppointment.day, ZONE);

						// 🔥 Ojo: paymentAppointment aquí viene del closure, pero está OK para template.
						// Si quieres 100% fresco, re-consulta payment por id.
						const fPago = new TZDate(paymentAppointment.transactionDate, ZONE);

						const datosEmail = {
							link_reunion: meetLink || "Por confirmar",
							cliente_nombre: paymentAppointment.client_name,
							cita_fecha: new Date(fCita.internal).toLocaleDateString("es-MX", opciones),
							cita_hora: `${freshAppointment.start_time.slice(0, 5)} - ${freshAppointment.end_time.slice(0, 5)}`,
							tipo_asesoria: "Asesoría Legal Online",
							metodo_pago: "Depósito / Transferencia",
							monto: paymentAppointment.amount,
							moneda: paymentAppointment.currency || "USD",
							referencia_pago: paymentAppointment.reference || "Sin referencia",
							fecha_pago: new Date(fPago.internal).toLocaleDateString("es-MX", opciones),
						};

						if (TEMPLATE_PAGO_EXITOSO && paymentAppointment.client_email) {
							console.log(`[${timestamp}] 📧 [BACKGROUND] Enviando email de confirmación...`);
							await sendBrevoEmail(TEMPLATE_PAGO_EXITOSO, paymentAppointment.client_email, datosEmail);
							console.log(`[${timestamp}] ✅ [BACKGROUND] Email enviado exitosamente`);
						}
					} catch (emailError) {
						console.error("❌ [BACKGROUND] Error enviando email:", emailError);
						logger.error(`Error enviando email de confirmación en background: ${emailError.message}`);
					}
				} catch (bgError) {
					console.error("❌ [BACKGROUND] Error en proceso background:", bgError);
					logger.error(`Error en proceso background de pago: ${bgError.message}`);
				}
			});
		}
	} catch (error) {
		await transaction.rollback();
		res.status(500).json({ status: "error", message: error.message });
	}
});

// ---------------------------------------------------------
// GET: Obtener pago por ID
// ---------------------------------------------------------
router.get("/:id", async (req, res) => {
	try {
		const data = await db.PaymentsAppointments.findByPk(req.params.id, {
			include: [{ model: db.PaymentImages, as: "PaymentImages" }],
		});
		res.status(200).json({ status: "success", data });
	} catch (e) {
		res.status(500).json({ status: "error", message: e.message });
	}
});

// ---------------------------------------------------------
// GET: Listar pagos (Pago Externo)
// ---------------------------------------------------------
router.get("/", async (req, res) => {
	try {
		const method = await db.PaymentsMethods.findOne({ where: { name: "Pago Externo" } });
		const data = await db.PaymentsAppointments.findAll({
			where: { paymentMethodId: method.id },
			order: [["createdAt", "DESC"]],
		});
		res.status(200).json({ status: "success", data });
	} catch (e) {
		res.status(500).json({ status: "error", message: e.message });
	}
});

// ---------------------------------------------------------
// DELETE: Eliminar pago
// ---------------------------------------------------------
router.delete("/:id", async (req, res) => {
	try {
		await db.PaymentsAppointments.destroy({ where: { id: req.params.id } });
		res.status(200).json({ status: "success", message: "Deleted" });
	} catch (e) {
		res.status(500).json({ status: "error", message: e.message });
	}
});

export default router;
