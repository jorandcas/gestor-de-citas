import express from "express";
import db from "../database/index.js";
import { uploadArray } from "../utils/manageFiles.js";
import { createNotification } from "../utils/notificationHelper.js";
import { TZDate } from "@date-fns/tz";
import logger from "../utils/logger.js";
// ✅ IMPORTAR EL ENVIADOR DE CORREOS
import { sendBrevoEmail } from "../utils/emailSender.js";
import { ensureMeetLinkForAppointment } from "../utils/meetLinkService.js";
import { ensureZoomLinkForAppointment } from "../utils/zoomLinkService.js";
import { assertUserCanBook } from "../utils/bookingRules.js";

const router = express.Router();

router.use(express.json());

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ZONE = process.env.ZONE_TIME;

// ✅ OBTENER EL ID DEL TEMPLATE DESDE EL .ENV
const TEMPLATE_CONFIRMACION_MANUAL = parseInt(process.env.BREVO_TEMPLATE_CONFIRMACION_MANUAL);
const TEMPLATE_PAGO_EXITOSO = parseInt(process.env.BREVO_TEMPLATE_PAGO_EXITOSO);

// 🔍 DEBUG AL INICIAR: Ver si la variable cargó
console.log("----------------------------------------------------");
console.log("🔍 DEBUG CARGA DE ROUTER PAGO MANUAL:");
console.log(`🆔 TEMPLATE ID LEÍDO: ${TEMPLATE_CONFIRMACION_MANUAL} (Tipo: ${typeof TEMPLATE_CONFIRMACION_MANUAL})`);
console.log("----------------------------------------------------");

// Create a new payment appointment
router.post("/", uploadArray("paymentImage", 1), async (req, res) => {
	// Usamos console.log para asegurar visibilidad en tu terminal
	console.log("|||||||||||||||||||||||||||||||||||||||||||||||");
	console.log("🚀 INICIANDO PROCESO DE PAGO MANUAL");

	const transaction = await db.sequelize.transaction();
	try {
		const formData = req.body;
		const files = req.files;

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
		} = formData;

		console.log(`📝 Datos recibidos: Cliente=${client_name}, Email=${client_email}`);

		const user = await db.User.findAll({
			where: { cleark_id: user_id },
		});
		const appointment = await db.Appointment.findAll({
			where: { id: appointment_id },
		});
		const PaymentsMethods = await db.PaymentsMethods.findAll({
			where: { name: "Pago Externo" },
		});

		if (!appointment || appointment.length === 0) {
			console.log("❌ Appointment not found");
			await transaction.rollback();
			return res.status(404).json({
				status: "error",
				message: "Appointment not found",
			});
		}
		if (appointment[0].status === 'reservado') {
			console.log("❌ Appointment is already booked");
			await transaction.rollback();
			return res.status(400).json({
				status: "error",
				message: "Appointment is already booked",
			});
		}


		if (user.length === 0) {
			console.log("❌ User not found");
			await transaction.rollback();
			return res.status(404).json({
				status: "error",
				message: "User not found",
			});
		}

		// 2️⃣ Regla de negocio: solo 1 cita activa por usuario
		try {
			await assertUserCanBook(user[0].id);
		} catch (e) {
			if (e?.code === "USER_HAS_ACTIVE_APPOINTMENT") {
				await transaction.rollback();
				return res.status(400).json({
					status: "error",
					code: e.code,
					message:
						"Ya tienes una cita activa. Podrás agendar otra cuando tu cita termine o sea cancelada.",
					activeAppointment: e.details,
				});
			}
			throw e; // cualquier otro error real
		}

		// 3️⃣ Validación: La referencia de pago debe ser única
		if (reference) {
			const existingPayment = await db.PaymentsAppointments.findOne({
				where: { reference: reference },
				transaction
			});

			if (existingPayment) {
				console.log("❌ La referencia de pago ya existe:", reference);
				await transaction.rollback();
				return res.status(400).json({
					status: "error",
					code: "DUPLICATE_REFERENCE",
					message: "El número de referencia ya ha sido utilizado anteriormente. Por favor, verifica e ingresa un número de referencia diferente.",
				});
			}
		}

		const paymentAppointment =
			await db.PaymentsAppointments.create(
				{
					paymentMethodId: PaymentsMethods[0].id,
					status: "pendiente",
					amount,
					reference,
					client_name,
					client_email,
					client_phone,
					notes,
					user_id: user[0].id,
					is_approved: null,
					currency: "USD",
					appointment_id: appointment_id
						? parseInt(appointment_id)
						: null,
					transactionDate: transactionDate
						? new TZDate(transactionDate, ZONE).internal
						: new TZDate(new Date(), ZONE).internal,
					createdAt: new TZDate(new Date(), ZONE).internal,
					updatedAt: new TZDate(new Date(), ZONE).internal,
				},
				{ transaction }
			);

		// guarda la informacion de la imagen y su ruta
		await db.PaymentImages.create(
			{
				payment_id: paymentAppointment.id,
				file_path:
					files && files.length > 0
						? `uploads/${files[0].filename}`
						: null,
				file_name:
					files && files.length > 0
						? files[0].originalname
						: null,
				uploaded_by: 1,
				is_active: true,
				created_at: new TZDate(new Date(), ZONE).internal,
				uploaded_at: new TZDate(new Date(), ZONE).internal,
			},
			{ transaction }
		);

		await db.Appointment.update(
			{
				status: "reservado",
				...(meetingPlatformId && { meetingPlatformId: parseInt(meetingPlatformId) })
			},
			{
				where: { id: paymentAppointment.appointment_id },
				transaction
			}
		);

		// Buscar al administrador
		const adminUser = await db.User.findOne({
			where: { email: ADMIN_EMAIL },
			transaction
		});

		if (!adminUser) {
			console.log("❌ Admin user not found");
			await transaction.rollback();
			return res.status(404).json({
				status: "error",
				message: "Admin user not found",
			});
		}

		// Crear notificación
		const requestUser = user && user.length ? user[0] : null;
		const appt = appointment && appointment.length ? appointment[0] : null;

		// Formatear la fecha
		let fechaFormateada = 'N/D';
		const opciones = { weekday: 'long', day: 'numeric', month: 'long' };

		if (appt?.day) {
			const fechaTz = new TZDate(appt.day, ZONE);
			const fechaNativa = new Date(fechaTz.internal);
			fechaFormateada = fechaNativa.toLocaleDateString('es-MX', opciones);
			fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
		}

		const creatingNotification = await db.Notification.create({
			title: 'Nuevo pago pendiente por aprobar',
			body: `Se ha recibido un pago por el monto de ${Number(paymentAppointment.amount).toFixed(2)}$${requestUser?.name ? ` por el usuario ${requestUser.name}` : ''}`,
			type: 'success',
			modalBody: `
			<b>Se ha recibido un pago por el monto de ${Number(paymentAppointment.amount).toFixed(2)}$${requestUser?.name ? ` por el usuario <b>${requestUser.name}</b>` : ''} para la fecha <b>${fechaFormateada}</b> que inicia a las <b>${appt?.start_time ? appt.start_time.slice(0, 5) : 'N/D'}</b> y termina a las <b>${appt?.end_time ? appt.end_time.slice(0, 5) : 'N/D'}</b></b><br>
			Nombre del cliente: <b>${client_name}</b><br>
			Teléfono del cliente: <b>${client_phone}</b><br>
			Correo electrónico: <b>${client_email}</b><br>
			Fecha de transacción: <b>${transactionDate}</b><br>
			Referencia: <b>${paymentAppointment.reference}</b><br>
			Monto del pago: <b>${Number(paymentAppointment.amount).toFixed(2)}</b><br>
			Notas: <b>${notes ?? 'No hay notas'}</b><br>
			Método de pago: <b>Pago Externo</b>
			`,
			user_id: adminUser.id,
			payment_id: paymentAppointment.id,
		}, { transaction });

		if (creatingNotification) {
			console.log("✅ Notificación interna creada");

			// =================================================================
			// 📧 INTENTO DE ENVÍO CON DIAGNÓSTICO EN CONSOLA
			// =================================================================
			try {
				// Chequeo explícito de variables
				console.log(`📧 DATOS PARA EMAIL: TemplateID=${TEMPLATE_CONFIRMACION_MANUAL}, Email=${client_email}`);

				if (TEMPLATE_CONFIRMACION_MANUAL && !isNaN(TEMPLATE_CONFIRMACION_MANUAL) && client_email) {
					console.log(`⏳ Intentando enviar a Brevo...`);

					await sendBrevoEmail(
						TEMPLATE_CONFIRMACION_MANUAL,
						client_email,
						{
							cliente_nombre: client_name,
							cita_fecha: fechaFormateada,
							cita_hora: `${appt?.start_time ? appt.start_time.slice(0, 5) : ''} - ${appt?.end_time ? appt.end_time.slice(0, 5) : ''}`,
							tipo_asesoria: "Asesoría Legal Online"
						}
					);
					console.log("✅✅✅ CORREO ENVIADO EXITOSAMENTE A BREVO");
				} else {
					console.error("⚠️ ALERTA: No se envió el correo porque falta el Template ID o el Email.");
					console.error(`   - Template ID: ${TEMPLATE_CONFIRMACION_MANUAL}`);
					console.error(`   - Email Cliente: ${client_email}`);
				}
			} catch (emailError) {
				console.error("❌ ERROR CRÍTICO ENVIANDO CORREO:", emailError);
			}
			// =================================================================

			await transaction.commit();

			console.log("🏁 Proceso completado correctamente");
			console.log("|||||||||||||||||||||||||||||||||||||||||||||||");

			res.status(201).json({
				status: "success",
				data: paymentAppointment,
			});

		} else {
			logger.error("Error creating notification");
			return res.status(500).json({
				status: "error",
				message: "Error creating notification",
			});
		}
	} catch (error) {
		await transaction.rollback();
		console.error("Error creating payment appointment:", error);
		res.status(500).json({
			status: "error",
			message: "Error creating payment appointment",
			error: error.message,
		});
	}
});

// Read payment appointment by ID
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const paymentAppointment =
			await db.PaymentsAppointments.findByPk(id, {
				include: [
					{
						model: db.PaymentImages,
						as: 'PaymentImages',
					},
				],
			});
		if (!paymentAppointment) {
			return res.status(404).json({
				status: "error",
				message: "Payment appointment not found",
			});
		}

		res.status(200).json({
			status: "success",
			data: paymentAppointment,
		});
	} catch (error) {
		console.error("Error fetching payment appointment:", error);
		res.status(500).json({
			status: "error",
			message: "Error fetching payment appointment",
			error: error.message,
		});
	}
});
router.get("/", async (req, res) => {
	try {
		const paymentMethod = await db.PaymentsMethods.findAll({
			where: { name: "Pago Externo" },
		});
		const response = await db.PaymentsAppointments.findAll({
			where: { paymentMethodId: paymentMethod[0].id },
			order: [['createdAt', 'DESC']],
		});
		res.status(200).json({
			status: "success",
			data: response,
		});
	} catch (error) {
		console.error("Error fetching payment appointments:", error);
		res.status(500).json({
			status: "error",
			message: "Error fetching payment appointments",
			error: error.message,
		});
	}
});


// Update payment appointment (APROBACIÓN DEL PAGO)
// Update payment appointment (APROBACIÓN DEL PAGO)
router.put("/:id", async (req, res) => {
	console.log("|||||||||||| ACTUALIZANDO ESTADO DE PAGO ||||||||||||");
	const transaction = await db.sequelize.transaction();
	try {
		const { id } = req.params;
		const status = req.body.status;
		const isActive =
			status === "completado"
				? true
				: status === "fallido"
					? false
					: null;

		const paymentAppointment = await db.PaymentsAppointments.findByPk(id);

		if (!paymentAppointment) {
			await transaction.rollback();
			return res.status(404).json({
				status: "error",
				message: "Payment appointment not found",
			});
		}

		const updatedPaymentAppointment = await paymentAppointment.update({
			status,
			is_approved: true,
			isActive,
		}, { transaction });

		// =================================================================
		// 📧 EMAIL #2: CONFIRMACIÓN DE PAGO (DATOS COMPLETOS)
		// =================================================================
		if (status === "completado") {

			// ✅ 0) Traer la cita
			const appointment = await db.Appointment.findByPk(paymentAppointment.appointment_id);

			if (!appointment) {
				console.warn("⚠️ No se encontró la cita para este pago:", paymentAppointment.appointment_id);
			}

			// ✅ 1) Asegurar link de reunión (Meet o Zoom)
			let meetLink = appointment?.meeting_link || null;

			if (!meetLink || meetLink.trim() === "") {
				try {
					// Obtener la plataforma seleccionada
					if (appointment.meetingPlatformId) {
						const platform = await db.MeetingPlatforms.findByPk(appointment.meetingPlatformId);
						const platformName = platform?.name?.toLowerCase() || '';

						console.log("📋 Plataforma seleccionada:", platformName);

						// Generar link según la plataforma
						if (platformName.includes('zoom')) {
							console.log("🎥 Generando link de ZOOM...");
							const { link } = await ensureZoomLinkForAppointment(paymentAppointment.appointment_id);
							meetLink = link;
							console.log("✅ Link de Zoom generado:", meetLink);
						} else if (platformName.includes('meet') || platformName.includes('google')) {
							console.log("🎥 Generando link de GOOGLE MEET...");
							const meet = await ensureMeetLinkForAppointment(paymentAppointment.appointment_id);
							meetLink = meet.link;
							console.log("✅ Link de Meet generado:", meetLink);
						} else {
							console.log("⚠️ Plataforma no reconocida, intentando con Meet por defecto:", platformName);
							const meet = await ensureMeetLinkForAppointment(paymentAppointment.appointment_id);
							meetLink = meet.link;
						}
					} else {
						// Si no hay plataforma seleccionada, intentar con Meet por defecto
						console.log("⚠️ No hay plataforma seleccionada, generando link de Meet por defecto");
						const meet = await ensureMeetLinkForAppointment(paymentAppointment.appointment_id);
						meetLink = meet.link;
						console.log("✅ Meet link generado:", meetLink);
					}
				} catch (e) {
					console.error("❌ No se pudo generar link de reunión:", e?.code || e?.message);
				}
			}

			try {
				const appointment = await db.Appointment.findByPk(paymentAppointment.appointment_id);

				if (appointment) {
					// 1. Formatear Fecha de la CITA
					let fechaCita = 'Por definir';
					const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

					if (appointment.day) {
						const fechaTz = new TZDate(appointment.day, ZONE);
						const fechaNativa = new Date(fechaTz.internal);
						fechaCita = fechaNativa.toLocaleDateString('es-MX', opciones);
						// Capitalizar primera letra (ej: Lunes...)
						fechaCita = fechaCita.charAt(0).toUpperCase() + fechaCita.slice(1);
					}

					// 2. Formatear Fecha del PAGO (TransactionDate)
					let fechaPago = 'N/D';
					if (paymentAppointment.transactionDate) {
						const fechaPagoTz = new TZDate(paymentAppointment.transactionDate, ZONE);
						const fechaPagoNativa = new Date(fechaPagoTz.internal);
						fechaPago = fechaPagoNativa.toLocaleDateString('es-MX', opciones);
					}

					// 3. Preparar OBJETO DE DATOS (Lo que pide tu plantilla)
					const datosEmail = {
						// ✅ NUEVO: el link del Meet para el Template 4 (ya está arriba)
						link_reunion: meetLink || "Por confirmar",

						// ✅ DATOS DE LA CITA
						cliente_nombre: paymentAppointment.client_name,
						cita_fecha: fechaCita,
						cita_hora: `${appointment.start_time.slice(0, 5)} - ${appointment.end_time.slice(0, 5)}`,
						tipo_asesoria: "Asesoría Legal Online",



						// ✅ DATOS FINANCIEROS QUE FALTABAN
						metodo_pago: "Depósito / Transferencia",
						monto: paymentAppointment.amount,
						moneda: paymentAppointment.currency || "USD",
						referencia_pago: paymentAppointment.reference || "Sin referencia",
						fecha_pago: fechaPago
					};

					// 🔍 VALIDACIÓN EN CONSOLA (Esto responde tu duda)
					console.log("------------------------------------------------");
					console.log("📤 DATOS ENVIADOS A BREVO:");
					console.log(datosEmail); // <--- Aquí verás exactamente qué se envía
					console.log("------------------------------------------------");

					// 4. Enviar
					if (TEMPLATE_PAGO_EXITOSO && paymentAppointment.client_email) {
						await sendBrevoEmail(
							TEMPLATE_PAGO_EXITOSO,
							paymentAppointment.client_email,
							datosEmail
						);
						console.log("✅ Correo de pago exitoso enviado.");
						console.log("📤 TEMPLATE:", TEMPLATE_PAGO_EXITOSO);
						console.log("📤 TO:", paymentAppointment.client_email);
						console.log("📤 PARAMS:", JSON.stringify(datosEmail, null, 2));

					}
				}
			} catch (emailError) {
				console.error("❌ Error enviando email (No afecta el guardado):", emailError);
			}
		}
		// =================================================================

		if (status && updatedPaymentAppointment.appointment_id) {
			await db.Notification.create({
				user_id: updatedPaymentAppointment.user_id,
				title: `Tu pago ha cambiado a ${status}.`,
				body: `Tu pago ha sido cambiado al estado: ${status}.`,
				type: status === "completado" ? "success" : status === "fallido" ? "error" : "other",
				payment_id: updatedPaymentAppointment.id,
				seen: false
			}, { transaction });
		}

		await transaction.commit();

		return res.status(200).json({
			data: updatedPaymentAppointment,
			status: "success",
			message: "Payment updated and notification created.",
		});

	} catch (error) {
		await transaction.rollback();
		console.error("❌ Error en transacción:", error);
		res.status(500).json({
			status: "error",
			message: "Error updating payment appointment",
			error: error.message,
		});
	}
});

// Delete payment appointment
router.delete("/:id", async (req, res) => {
	const transaction = await db.sequelize.transaction();
	try {
		const { id } = req.params;

		const paymentAppointment =
			await db.PaymentsAppointments.findByPk(id);

		if (!paymentAppointment) {
			return res.status(404).json({
				status: "error",
				message: "Payment appointment not found",
			});
		}

		await paymentAppointment.destroy({ transaction });
		await transaction.commit();

		res.status(200).json({
			status: "success",
			message: "Payment appointment deleted successfully",
		});
	} catch (error) {
		await transaction.rollback();
		console.error("Error deleting payment appointment:", error);
		res.status(500).json({
			status: "error",
			message: "Error deleting payment appointment",
			error: error.message,
		});
	}
});

export default router;