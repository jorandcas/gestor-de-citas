import { google } from "googleapis";
import moment from "moment-timezone";
import db from "../database/index.js";

const redirectUri =
    process.env.NODE_ENV === "production"
        ? process.env.GOOGLE_REDIRECT_URI
        : process.env.GOOGLE_REDIRECT_URI_LOCAL;

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
);

const TZ = process.env.ZONE_TIME || "America/Mexico_City";

function buildDateTime(appointmentDay, timeHHMMSS) {
    // Parsear la fecha que viene en UTC
    const localDate = moment(appointmentDay).tz(TZ);
    const dateStr = localDate.format("YYYY-MM-DD");

    // Crear la fecha-hora combinando fecha local + hora local en la zona horaria correcta
    const result = moment.tz(`${dateStr} ${timeHHMMSS}`, "YYYY-MM-DD HH:mm:ss", TZ);

    console.log(`  buildDateTime: appointmentDay=${appointmentDay}, time=${timeHHMMSS}`);
    console.log(`  buildDateTime: localDate=${dateStr}, result=${result.format()}`);

    return result.format();
}

// ✅ EXPORT NOMBRADO (ESM)
export async function ensureMeetLinkForAppointment(appointmentId) {
    const appointment = await db.Appointment.findByPk(appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    if (appointment.meeting_link && appointment.meeting_link.trim() !== "") {
        return { appointment, link: appointment.meeting_link, created: false };
    }

    const admin = await db.User.findOne({
        where: { email: process.env.ADMIN_EMAIL },
        attributes: ["hash_google_meet"],
    });

    if (!admin?.hash_google_meet) {
        const err = new Error("NO_GOOGLE_MEET_REFRESH_TOKEN");
        err.code = "NO_GOOGLE_MEET_REFRESH_TOKEN";
        throw err;
    }

    oAuth2Client.setCredentials({ refresh_token: admin.hash_google_meet });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const startTime = buildDateTime(appointment.day, appointment.start_time);
    const endTime = buildDateTime(appointment.day, appointment.end_time);

    console.log("📅 FECHAS PARA GOOGLE CALENDAR:");
    console.log("appointment.day:", appointment.day);
    console.log("appointment.start_time:", appointment.start_time);
    console.log("appointment.end_time:", appointment.end_time);
    console.log("startTime:", startTime);
    console.log("endTime:", endTime);
    console.log("timeZone:", TZ);
    console.log("Fecha actual (UTC):", new Date().toISOString());
    console.log("Fecha actual (Mexico):", moment().tz(TZ).format());

    try {
        const event = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: "Reunión",
                start: { dateTime: startTime, timeZone: TZ },
                end: { dateTime: endTime, timeZone: TZ },
                conferenceData: {
                    createRequest: { requestId: `meet-${Date.now()}` },
                },
            },
            conferenceDataVersion: 1,
        });

        const link = event?.data?.hangoutLink;
        if (!link) throw new Error("Meet link not generated");

        appointment.meeting_link = link;
        await appointment.save();

        return { appointment, link, created: true };
    } catch (err) {
        console.error("❌ ERROR DE GOOGLE CALENDAR:");
        console.error("Código:", err.code);
        console.error("Mensaje:", err.message);
        console.error("Detalles:", JSON.stringify(err.response?.data || {}, null, 2));
        throw err;
    }
}

