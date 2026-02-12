import axios from "axios";
import moment from "moment-timezone";
import db from "../database/index.js";

const TZ = process.env.ZONE_TIME || "America/Mexico_City";

/**
 * Obtiene un access token de Zoom usando Server-to-Server OAuth
 */
async function getZoomAccessToken() {
	try {
		const response = await axios.post(
			`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
			null,
			{
				auth: {
					username: process.env.ZOOM_CLIENT_ID,
					password: process.env.ZOOM_CLIENT_SECRET,
				},
			}
		);

		return response.data.access_token;
	} catch (error) {
		console.error("❌ ERROR obteniendo access token de Zoom:", error.response?.data || error.message);
		throw new Error("Failed to get Zoom access token");
	}
}

/**
 * Construye una fecha/hora en el formato correcto para Zoom
 */
function buildDateTime(appointmentDay, timeHHMMSS) {
	// appointmentDay viene de la BD como un objeto Date
	// Obtenemos la fecha como string en formato YYYY-MM-DD
	const dateStr = moment(appointmentDay).format("YYYY-MM-DD");

	// Combinar la fecha con la hora en el timezone correcto
	const result = moment.tz(`${dateStr} ${timeHHMMSS}`, "YYYY-MM-DD HH:mm:ss", TZ);

	console.log(`  [ZOOM] buildDateTime: appointmentDay=${appointmentDay}, time=${timeHHMMSS}`);
	console.log(`  [ZOOM] buildDateTime: dateStr=${dateStr}, result=${result.format()}`);
	console.log(`  [ZOOM] result.toISOString()=${result.toISOString()}`);

	return result;
}

/**
 * Crea una reunión de Zoom
 */
async function createZoomMeeting(appointmentData) {
	const { startTime, endTime, title } = appointmentData;

	const start = buildDateTime(appointmentData.day, appointmentData.start_time);
	const end = buildDateTime(appointmentData.day, appointmentData.end_time);

	// Calcular duración en minutos
	const duration = Math.round(moment(end).diff(moment(start), "minutes"));

	console.log("📅 FECHAS PARA ZOOM:");
	console.log("appointment.day:", appointmentData.day);
	console.log("appointment.start_time:", appointmentData.start_time);
	console.log("appointment.end_time:", appointmentData.end_time);
	console.log("startTime:", start.format());
	console.log("endTime:", end.format());
	console.log("startTime ISO (UTC):", start.toISOString());
	console.log("startTime local:", start.format("YYYY-MM-DDTHH:mm:ss"));
	console.log("duration (minutes):", duration);
	console.log("timeZone:", TZ);

	try {
		const accessToken = await getZoomAccessToken();

		// IMPORTANTE: Para Zoom, cuando se especifica timezone,
		// se debe enviar start_time en formato local (YYYY-MM-DDTHH:mm:ss)
		// Usamos el formato completo y removemos el offset para enviar solo la hora local
		const startFormatted = start.format(); // "2026-01-28T12:00:00-06:00"
		const startTimeForZoom = startFormatted.substring(0, 19); // "2026-01-28T12:00:00"

		console.log("📤 ENVIANDO A ZOOM:");
		console.log("  start_time:", startTimeForZoom);
		console.log("  duration:", duration);
		console.log("  timezone:", TZ);

		const response = await axios.post(
			"https://api.zoom.us/v2/users/me/meetings",
			{
				topic: title || "Cita de Asesoría",
				type: 2, // Scheduled meeting
				start_time: startTimeForZoom, // Hora local en formato YYYY-MM-DDTHH:mm:ss
				duration: duration,
				timezone: TZ, // Timezone de la reunión
				settings: {
					host_video: true,
					participant_video: true,
					join_before_host: false,
					mute_upon_entry: false,
					watermark: false,
					use_pmi: false,
					approval_type: 2, // No approval required
					audio: "both",
					auto_recording: "none",
					enforce_login: false,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);

		console.log("✅ ZOOM MEETING CREATED:", response.data.join_url);

		return {
			meetingUrl: response.data.join_url,
			meetingId: response.data.id,
			password: response.data.password,
		};
	} catch (error) {
		console.error("❌ ERROR DE ZOOM API:");
		console.error("Código:", error.code);
		console.error("Mensaje:", error.message);
		console.error("Detalles:", JSON.stringify(error.response?.data || {}, null, 2));
		throw error;
	}
}

/**
 * Asegura que una cita tenga un link de Zoom
 * @param {number} appointmentId - ID de la cita
 */
export async function ensureZoomLinkForAppointment(appointmentId) {
	try {
		console.log("🎥 ensureZoomLinkForAppointment llamado para appointmentId:", appointmentId);

		const appointment = await db.Appointment.findByPk(appointmentId);
		if (!appointment) {
			console.error("❌ Cita no encontrada:", appointmentId);
			throw new Error("Appointment not found");
		}

		console.log("📋 Datos de la cita:", {
			id: appointment.id,
			day: appointment.day,
			start_time: appointment.start_time,
			end_time: appointment.end_time,
			meeting_link: appointment.meeting_link
		});

		// Si ya tiene link, retornarlo
		if (appointment.meeting_link && appointment.meeting_link.trim() !== "") {
			console.log("✅ La cita YA tiene link de Zoom:", appointment.meeting_link);
			return { appointment, link: appointment.meeting_link, created: false };
		}

		console.log("🔨 Creando nueva reunión de Zoom...");
		// Crear la reunión de Zoom
		const zoomMeeting = await createZoomMeeting({
			day: appointment.day,
			start_time: appointment.start_time,
			end_time: appointment.end_time,
			title: `Cita de Asesoría - $${appointment.price}`,
		});

		console.log("✅ Reunión de Zoom creada:", zoomMeeting.meetingUrl);

		// Guardar el link en la cita
		appointment.meeting_link = zoomMeeting.meetingUrl;
		await appointment.save();

		console.log("✅ ZOOM LINK SAVED en base de datos:", zoomMeeting.meetingUrl);

		return { appointment, link: zoomMeeting.meetingUrl, created: true };
	} catch (error) {
		console.error("❌ ERROR en ensureZoomLinkForAppointment:", error.message);
		console.error("❌ Stack trace:", error.stack);
		throw error;
	}
}
