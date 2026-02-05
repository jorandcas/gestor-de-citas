import { TZDate } from "@date-fns/tz";
import db from "../database/index.js";
import express from "express";
import { google } from "googleapis";
import { ensureZoomLinkForAppointment } from "../utils/zoomLinkService.js";

const API_PREFIX = process.env.API_PREFIX; // /api

const redirectUri =
	process.env.NODE_ENV === "production"
		? process.env.GOOGLE_REDIRECT_URI
		: process.env.GOOGLE_REDIRECT_URI_LOCAL;

const oAuth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	redirectUri
);

const router = express.Router();
router.get("/auth", (req, res) => {
	const url = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: ["https://www.googleapis.com/auth/calendar.events"],
	});
	res.redirect(url);
});


router.post("/generate-meet-link/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const user = await db.User.findOne({
			where: { email: process.env.ADMIN_EMAIL },
			attributes: ["hash_google_meet"],
		});
		// Si no existe el usuario o el hash_google_meet está vacío/null, redirige a auth
		if (!user || !user.hash_google_meet) {
			console.log("ola");
			return res.status(200).json({
				link: "/generate-link/auth",
				status: "redirect",
			});
		}
		oAuth2Client.setCredentials({
			refresh_token: user.hash_google_meet,
		});
		const infoAppointment = await db.Appointment.findByPk(id);
		if (!infoAppointment) {
			return res
				.status(404)
				.json({ error: "Appointment not found" });
		}
		const year = new Date(infoAppointment.day).getFullYear();
		const month = new Date(infoAppointment.day).getMonth() + 1;
		const day = new Date(infoAppointment.day).getDate();
		const startTime =
			year +
			"-" +
			(month < 10 ? "0" + month : month) +
			"-" +
			(day < 10 ? "0" + day : day) +
			"T" +
			infoAppointment.start_time +
			"-00:00";
		const endTime =
			year +
			"-" +
			(month < 10 ? "0" + month : month) +
			"-" +
			(day < 10 ? "0" + day : day) +
			"T" +
			infoAppointment.end_time +
			"-00:00";
		const calendar = google.calendar({
			version: "v3",
			auth: oAuth2Client,
		});
		const event = await calendar.events.insert({
			calendarId: "primary",
			requestBody: {
				summary: "Reunión",
				start: {
					dateTime: startTime,
					timeZone: process.env.ZONE_TIME,
				},
				end: {
					dateTime: endTime,
					timeZone: process.env.ZONE_TIME,
				},
				conferenceData: {
					createRequest: {
						requestId: `meet-${Date.now()}`,
					},
				},
			},
			conferenceDataVersion: 1,
		});
		console.log(event.data);
		res.status(200).json({
			status: "success",
			link: event.data.hangoutLink,
		});
	} catch (error) {
		console.error("Error generating link:", error);
		if (
			error.message.includes("invalid_grant") ||
			error.message.includes("invalid_token") ||
			error.message.includes("Token has been expired")
		) {
			res.redirect("/generate-link/auth");
		} else {
			console.error("Error generating link:", error);
			res.status(500).json({
				error: "Error generating link",
				message: error.message,
				link: "/generate-link/auth",
			});
		}
	}
});
router.put("/save-meet-link/:id", async (req, res) => {
	const { id } = req.params;
	const { link } = req.body;
	try {
		const appointment = await db.Appointment.findByPk(id);
		const paymentAppointment = await db.PaymentsAppointments.findOne({
			where: { appointment_id: appointment.id },
		});
		if (!appointment) {
			return res
				.status(404)
				.json({ error: "Appointment not found" });
		}
		appointment.meeting_link = link;
		await appointment.save();
		const creatingNotification = await db.Notification.create({
			title: 'Link de la reunión generado',
			body: `Se ha generado un nuevo link para la reunión.`,
			type: 'success',
			modalBody: `El link de la reunión para la cita del día ${new TZDate(appointment.day).toLocaleString()} ha sido generado exitosamente.
					Puedes encontrar el link en los detalles de la cita.
					| Link de la reunión: ${link}
			`,
			user_id: paymentAppointment.user_id,
			payment_id: paymentAppointment.id,
		});
		res.status(200).json({
			status: "success",
			appointment,
			message: "Meeting link saved successfully",
		});
	} catch (error) {
		console.error("Error saving meeting link:", error);
		res.status(500).json({
			error: "Error saving meeting link",
			message: error.message,
		});
	}
});

router.get("/oauth2callback", async (req, res) => {
	const code = req.query.code;
	try {
		const { tokens } = await oAuth2Client.getToken(code);
		console.log(tokens);

		// Importante: NO sobreescribir si no viene refresh_token
		if (tokens.refresh_token) {
			await db.User.update(
				{ hash_google_meet: tokens.refresh_token },
				{ where: { email: process.env.ADMIN_EMAIL } }
			);
		}

		res.setHeader("Content-Security-Policy", "script-src 'self' 'nonce-12345';");
		res.send(`
      <html>
        <body>
          <script nonce="12345">
            if (window.opener) window.opener.postMessage({ success: true }, "*");
            setTimeout(() => window.close(), 2000);
          </script>
          <p>Autenticación exitosa. Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
	} catch (err) {
		console.error(err);
		res.send(`
      <html>
        <body>
          <script>
            if (window.opener) window.opener.postMessage({ success: false, error: "${err.message}" }, "*");
            window.close();
          </script>
          <p>Error en la autenticación. Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
	}
});

// ========== RUTAS DE ZOOM ==========

/**
 * Genera un link de Zoom para una cita
 */
router.post("/generate-zoom-link/:id", async (req, res) => {
	try {
		const { id } = req.params;

		// Verificar si las credenciales de Zoom están configuradas
		if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
			return res.status(400).json({
				status: "error",
				message: "ZOOM_NOT_CONFIGURED",
				error: "Las credenciales de Zoom no están configuradas en el servidor",
			});
		}

		const result = await ensureZoomLinkForAppointment(id);

		res.status(200).json({
			status: "success",
			link: result.link,
			created: result.created,
		});
	} catch (error) {
		console.error("❌ ERROR generando link de Zoom:", error);
		res.status(500).json({
			status: "error",
			message: error.message,
			error: "Error generando link de Zoom",
		});
	}
});

/**
 * Guarda manualmente un link de Zoom (u otro) para una cita
 */
router.put("/save-zoom-link/:id", async (req, res) => {
	const { id } = req.params;
	const { link } = req.body;
	try {
		const appointment = await db.Appointment.findByPk(id);
		const paymentAppointment = await db.PaymentsAppointments.findOne({
			where: { appointment_id: appointment.id },
		});

		if (!appointment) {
			return res.status(404).json({ error: "Appointment not found" });
		}

		appointment.meeting_link = link;
		await appointment.save();

		const creatingNotification = await db.Notification.create({
			title: 'Link de la reunión generado',
			body: `Se ha generado un nuevo link para la reunión.`,
			type: 'success',
			modalBody: `El link de la reunión para la cita del día ${new TZDate(appointment.day).toLocaleString()} ha sido generado exitosamente.
					Puedes encontrar el link en los detalles de la cita.
					| Link de la reunión: ${link}
			`,
			user_id: paymentAppointment.user_id,
			payment_id: paymentAppointment.id,
		});

		res.status(200).json({
			status: "success",
			appointment,
			message: "Meeting link saved successfully",
		});
	} catch (error) {
		console.error("Error saving meeting link:", error);
		res.status(500).json({
			error: "Error saving meeting link",
			message: error.message,
		});
	}
});



export default router;
