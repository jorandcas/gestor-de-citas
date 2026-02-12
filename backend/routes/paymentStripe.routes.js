import db from "../database/index.js";
import express from "express";
import Stripe from "stripe"; // Cambiado el nombre del import
import { createNotification } from "../utils/notificationHelper.js";
import { sendBrevoEmail } from "../utils/emailSender.js";
import { TZDate } from "@date-fns/tz";
import { ensureMeetLinkForAppointment } from "../utils/meetLinkService.js";
import { ensureZoomLinkForAppointment } from "../utils/zoomLinkService.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Instancia de Stripe
const URL_FRONTEND = process.env.URL_FRONTEND || 'http://localhost:5173';
const TEMPLATE_PAGO_EXITOSO = parseInt(process.env.BREVO_TEMPLATE_PAGO_EXITOSO);
const ZONE = process.env.ZONE_TIME || 'America/Mexico_City';
router.post("/create-checkout-session", async (req, res) => {
	try {
		const url = URL_FRONTEND;
		const { amount, success_url, cancel_url, appointmentId, meetingPlatformId } = req.body;
			console.log(url)
		const appointmentInfo = await db.Appointment.findByPk(appointmentId);
		const currencyInfo = await db.Currency.findByPk(appointmentInfo?.currency_id);
		if(!amount || !appointmentId){
			console.log(appointmentId)
			return res.status(400).json({
				status: "error",
				message: "Missing required fields: amount, appointmentId"
			});
		}
		 const amountInCents = Math.round(amount * 100);

		// Construir URL de éxito con meetingPlatformId si existe
		let successUrl = `${url}/success?appointmentId=${appointmentId}&session_id={CHECKOUT_SESSION_ID}`;
		if (meetingPlatformId) {
			successUrl += `&meetingPlatformId=${meetingPlatformId}`;
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: currencyInfo?.code,
						product_data: {
							name: "Asesoría Becerramanchinelly",
						},
						unit_amount: amountInCents,
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: successUrl,
			cancel_url: `${url}/canceled`,
		});
		console.log(session)
		res.status(200).json({
			status: "success",
			sessionId: session.id,
			url: session.url,
		});
	} catch (error) {
		console.log(error)
		res.status(500).json({
			status: "error",
			message: "Error creating checkout session",
			error: error.message,
		});
	}
});
router.get("/verify-session", async (req, res) => {
	const { session_id } = req.query; // Obtener el parámetro de consulta session_id

	try {
		if (!session_id) {
			return res.status(400).json({
				status: "error",
				message: "Missing required query parameter: session_id",
			});
		}

		const session = await stripe.checkout.sessions.retrieve(session_id); // Recuperar la sesión de Stripe
		console.log('session:', session);
		res.status(200).json({
			status: "success",
			session,
		});
	} catch (error) {
		res.status(500).json({
			status: "error",
			message: "Error verifying checkout session",
			error: error.message,
		});
	}
});
router.put('/updateStatus',async(req,res)=>{
		const transaction = await db.sequelize.transaction();

	const {appointmentId,user_id,amount,client_name,paymentId,meetingPlatformId} = req.body;
		const user = await db.User.findAll({
				where: { cleark_id: user_id },
			});
			if (user.length === 0) {
				return res.status(404).json({
					status: "error",
					message: "User not found",
				});
			}
			const transactionDate = new Date();
			const PaymentsMethods = await db.PaymentsMethods.findAll({
				where: { name: "Stripe" },
			});
		const verifyIfPaymentExists = await db.PaymentsAppointments.findOne({
			where: { reference: paymentId },
		});
		if (verifyIfPaymentExists) {
			return res.status(400).json({
				status: "error",
				message: "Payment already has registered",
			});
		}
	try {
		if(!appointmentId){
			return res.status(400).json({
				status: "error",
				message: "Missing required fields: appointmentId"
			});
		}
		const paymentAppointment =
				await db.PaymentsAppointments.create(
					{
						paymentMethodId: PaymentsMethods[0].id,
						status: "completado",
						amount,
						reference: paymentId,
						client_name,
						client_email: user[0].email,
						user_id: user[0].id,
						is_approved: null,
						currency: "USD",
						appointment_id: appointmentId
							? parseInt(appointmentId)
							: null,
						is_approved: true,
						transactionDate: transactionDate
							? new Date(transactionDate)
							: new Date(),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					{ transaction }
				);

		const appointment = await db.Appointment.findByPk(appointmentId);
		if(!paymentAppointment){
			return res.status(404).json({
				status: "error",
				message: "payment not found"
			});
		}
		if (!appointment) {
			return res.status(404).json({
				status: "error",
				message: "Appointment not found",
			});
		}
		const updateAppointment=await appointment.update(
			{
				status: "reservado",
				...(meetingPlatformId && { meetingPlatformId: parseInt(meetingPlatformId) })
			},
			{
				where: { id: appointmentId },
				transaction,
			});

		await transaction.commit();

		// Generar link de reunión automáticamente si se seleccionó plataforma (DESPUÉS del commit)
		if (meetingPlatformId) {
			try {
				console.log("🎯 Generando link de reunión para cita:", appointmentId);

				// Obtener la cita actualizada para saber qué plataforma se seleccionó
				const updatedAppointment = await db.Appointment.findByPk(appointmentId);

				if (!updatedAppointment) {
					console.error("❌ No se encontró la cita para generar el link");
					return;
				}

				// Obtener el nombre de la plataforma
				const platform = await db.MeetingPlatforms.findByPk(meetingPlatformId);
				const platformName = platform?.name?.toLowerCase() || '';

				console.log("📋 Plataforma seleccionada:", platformName);

				// Generar link según la plataforma
				if (platformName.includes('zoom')) {
					console.log("🎥 Generando link de ZOOM...");
					const { link } = await ensureZoomLinkForAppointment(appointmentId);
					console.log("✅ Link de Zoom generado:", link);
				} else if (platformName.includes('meet') || platformName.includes('google')) {
					console.log("🎥 Generando link de GOOGLE MEET...");
					const { link } = await ensureMeetLinkForAppointment(appointmentId);
					console.log("✅ Link de Meet generado:", link);
				} else {
					console.log("⚠️ Plataforma no reconocida, no se genera link automático:", platformName);
				}
			} catch (meetError) {
				console.error("❌ Error generando link de reunión (No afecta el pago):", meetError.message);
				// No fallar el pago si falla la creación del link
			}
		}

		// ======================= ENVIAR CORREO DE CONFIRMACIÓN =======================
		try {
			// Recargar la cita con todos los datos
			const updatedAppointment = await db.Appointment.findByPk(appointmentId);

			if (updatedAppointment && paymentAppointment.client_email) {
				// 1. Formatear Fecha de la CITA
				let fechaCita = 'N/D';
				const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

				if (updatedAppointment.day) {
					const fechaTz = new TZDate(updatedAppointment.day, ZONE);
					const fechaNativa = new Date(fechaTz.internal);
					fechaCita = fechaNativa.toLocaleDateString('es-MX', opciones);
					fechaCita = fechaCita.charAt(0).toUpperCase() + fechaCita.slice(1);
				}

				// 2. Formatear Fecha del PAGO
				let fechaPago = 'N/D';
				if (paymentAppointment.transactionDate) {
					const fechaPagoTz = new TZDate(paymentAppointment.transactionDate, ZONE);
					const fechaPagoNativa = new Date(fechaPagoTz.internal);
					fechaPago = fechaPagoNativa.toLocaleDateString('es-MX', opciones);
				}

				// 3. Preparar datos del correo
				const datosEmail = {
					link_reunion: updatedAppointment.meeting_link || "Por confirmar",
					cliente_nombre: paymentAppointment.client_name,
					cita_fecha: fechaCita,
					cita_hora: `${updatedAppointment.start_time.slice(0, 5)} - ${updatedAppointment.end_time.slice(0, 5)}`,
					tipo_asesoria: "Asesoría Legal Online",
					metodo_pago: "Stripe",
					monto: paymentAppointment.amount,
					moneda: paymentAppointment.currency || "USD",
					referencia_pago: paymentAppointment.reference || "Sin referencia",
					fecha_pago: fechaPago
				};

				console.log("📤 ENVIANDO CORREO DE PAGO EXITOSO (Stripe):");
				console.log("TO:", paymentAppointment.client_email);
				console.log("TEMPLATE:", TEMPLATE_PAGO_EXITOSO);

				// 4. Enviar correo
				if (TEMPLATE_PAGO_EXITOSO) {
					await sendBrevoEmail(
						TEMPLATE_PAGO_EXITOSO,
						paymentAppointment.client_email,
						datosEmail
					);
					console.log("✅ Correo de pago exitoso enviado correctamente.");

					// Marcar que se envió el correo
					await updatedAppointment.update({
						payment_confirm_email_sent: true
					});
				} else {
					console.warn("⚠️ TEMPLATE_PAGO_EXITOSO no está configurado en .env");
				}
			}
		} catch (emailError) {
			console.error("❌ Error enviando email de confirmación (No afecta el pago):", emailError);
		}
		// ============================================================================

		const notification = await createNotification({
						userId: user[0].id,
						title: `Tu pago ha cambiado a ${paymentAppointment.status}.`,
						message: `Tu pago ha sido cambiado al estado: ${paymentAppointment.status}.`,
						type:
							paymentAppointment === "completado"
								? "success"
								: paymentAppointment.status === "fallido"
								? "error"
								: "other",
						payment_id: paymentAppointment.id,
					});
		res.status(200).json({
			status: "success",
			paymentAppointment,
			updateAppointment
		});

	} catch (error) {
		console.error("Error updating appointment status:", error);
		res.status(500).json({
			status: "error",
			message: "Error updating appointment status",
			error: error.message,
		});
	}
});

router.get("/", async (req, res) => {;
	try {
		const paymentMehtods = await db.PaymentsMethods.findAll({
			where: { name: "Stripe" },
		});
		if (paymentMehtods.length === 0) {
			return res.status(404).json({
				status: "error",
				message: "Payment methods not found",
			});
		}
		const paymentsAppointments = await db.PaymentsAppointments.findAll({
			where: { paymentMethodId: paymentMehtods[0].id },

			order: [["createdAt", "DESC"]],
		});
		res.status(200).json({
			paymentsAppointments,
			status: "success",
		});
	} catch (error) {
		console.error("Error retrieving payments appointments:", error);
		res.status(500).json({
			status: "error",
			message: "Error retrieving payments appointments",
			error: error.message,
		});
	}
})

router.get("/:id", async (req, res) => {
	const { id } = req.params;
	console.log(id)
	try {
		const paymentAppointment = await db.PaymentsAppointments.findByPk(id);
		if (!paymentAppointment) {
			return res.status(404).json({
				status: "error",
				message: "Payment appointment not found",
			});
		}
		res.status(200).json({
			paymentAppointment,
			status: "success",
		});
	} catch (error) {
		console.error("Error retrieving payment appointment:", error);
		res.status(500).json({
			status: "error",
			message: "Error retrieving payment appointment",
			error: error.message,
		});
	}
});
export default router;