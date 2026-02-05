import axios from "axios";
import moment from "moment-timezone";

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

const TZ = process.env.ZONE_TIME || "America/Mexico_City";

console.log("🧪 PRUEBA REAL DE ZONA HORARIA PARA ZOOM");
console.log("=".repeat(70));
console.log("\nConfiguración:");
console.log(`  Zona horaria del sistema: ${TZ}`);
console.log(`  Fecha/hora actual en ${TZ}: ${moment().tz(TZ).format()}`);
console.log(`  Fecha/hora actual UTC: ${moment().utc().format()}\n`);

// SIMULAR CÓMO VIENEN LOS DATOS DE LA BASE DE DATOS
// Cuando Sequelize devuelve un DATE, viene como un objeto Date JavaScript
// que representa la fecha en la zona horaria configurada de la BD

// Ejemplo: El usuario selecciona "2026-01-28" en el frontend
// Se guarda en BD como "2026-01-28 12:00:00" en el timezone de la BD
// Sequelize lo devuelve como un objeto Date

console.log("📋 ESCENARIO 1: El usuario selecciona 12:00 PM el 2026-01-28");
console.log("-".repeat(70));

// En la BD, con timezone America/Mexico_City, la cita se guarda como:
// day: 2026-01-28 00:00:00 (solo fecha)
// start_time: 12:00:00 (hora separada)

// Cuando Sequelize lo devuelve:
const appointmentFromDB = {
	day: new Date("2026-01-28T00:00:00-06:00"), // Fecha con timezone de Mexico City
	start_time: "12:00:00",
	end_time: "13:30:00"
};

console.log("Datos recibidos de la BD:");
console.log(`  day (Date object): ${appointmentFromDB.day.toISOString()}`);
console.log(`  day (local): ${appointmentFromDB.day.toLocaleString()}`);
console.log(`  start_time: ${appointmentFromDB.start_time}`);
console.log(`  end_time: ${appointmentFromDB.end_time}\n`);

// Replicar la lógica ACTUALIZADA de zoomLinkService
function buildDateTime(appointmentDay, timeHHMMSS) {
	// appointmentDay viene de la BD como un objeto Date
	// Obtenemos la fecha como string en formato YYYY-MM-DD
	const dateStr = moment(appointmentDay).format("YYYY-MM-DD");

	// Combinar la fecha con la hora en el timezone correcto
	const result = moment.tz(`${dateStr} ${timeHHMMSS}`, "YYYY-MM-DD HH:mm:ss", TZ);

	console.log(`  [DEBUG] appointmentDay: ${appointmentDay}`);
	console.log(`  [DEBUG] moment(appointmentDay).format('YYYY-MM-DD'): ${dateStr}`);
	console.log(`  [DEBUG] result: ${result.format()}`);

	return result;
}

console.log("Cálculo con la lógica actual:");
const start = buildDateTime(appointmentFromDB.day, appointmentFromDB.start_time);
const end = buildDateTime(appointmentFromDB.day, appointmentFromDB.end_time);

console.log("\n📅 RESULTADO:");
console.log("=".repeat(70));
const startFormatted = start.format();
console.log(`  startTime local: ${startFormatted}`);
console.log(`  startTime UTC: ${start.utc().format()}`);
console.log(`  [DEBUG] Longitud de startFormatted: ${startFormatted.length}`);
console.log(`  [DEBUG] startFormatted.charCodeAt(11): ${startFormatted.charCodeAt(11)} (debería ser 49 para '1')`);
console.log(`  [DEBUG] startFormatted.charCodeAt(12): ${startFormatted.charCodeAt(12)} (debería ser 50 para '2')`);
console.log(`  [DEBUG] startFormatted.substring(0, 19): ${startFormatted.substring(0, 19)}`);
const startTimeForZoom = startFormatted.substring(0, 19);
console.log(`  startTime para Zoom: ${startTimeForZoom}`);
console.log(`  Duración: ${Math.round(moment(end).diff(moment(start), "minutes"))} minutos\n`);
console.log("📤 DATOS QUE SE ENVÍAN A ZOOM:");
console.log("=".repeat(70));
console.log(`  start_time: ${startTimeForZoom}`);
console.log(`  duration: ${Math.round(moment(end).diff(moment(start), "minutes"))}`);
console.log(`  timezone: ${TZ}\n`);

// Verificar si es correcto
const expectedHour = 12;
const actualHour = parseInt(startTimeForZoom.split("T")[1].split(":")[0]);

if (actualHour === expectedHour) {
	console.log("✅ CORRECTO: La reunión se programará a las", expectedHour, ":00");
} else {
	console.log(`❌ ERROR: Se esperaban las ${expectedHour}:00 pero se enviaron las ${actualHour}:00`);
	console.log(`   Diferencia: ${actualHour - expectedHour} horas`);
}

// Opcional: Crear reunión de prueba
async function createTestMeeting() {
	try {
		console.log("\n🎥 Creando reunión de prueba en Zoom...");

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

		const accessToken = response.data.access_token;

		const meetingResponse = await axios.post(
			'https://api.zoom.us/v2/users/me/meetings',
			{
				topic: `TEST - Cita a las ${expectedHour}:00 - Verificar Zona Horaria`,
				type: 2,
				start_time: startTimeForZoom,
				duration: Math.round(moment(end).diff(moment(start), "minutes")),
				timezone: TZ,
				settings: {
					host_video: false,
					participant_video: false,
					join_before_host: true,
				},
			},
			{
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		console.log("✅ REUNIÓN CREADA EXITOSAMENTE:");
		console.log("=".repeat(70));
		console.log(`  ID: ${meetingResponse.data.id}`);
		console.log(`  Topic: ${meetingResponse.data.topic}`);
		console.log(`  Start Time: ${meetingResponse.data.start_time}`);
		console.log(`  Duration: ${meetingResponse.data.duration} minutos`);
		console.log(`  Timezone: ${meetingResponse.data.timezone}`);
		console.log(`  Join URL: ${meetingResponse.data.join_url}\n`);

		console.log("🔎 REVISA TU DASHBOARD DE ZOOM:");
		console.log(`   La reunión debería aparecer a las ${expectedHour}:00 ${TZ}`);
		console.log("   Si aparece a otra hora, hay un problema de zona horaria.\n");

	} catch (error) {
		console.error("\n❌ ERROR creando la reunión:");
		if (error.response) {
			console.error("   Status:", error.response.status);
			console.error("   Data:", JSON.stringify(error.response.data, null, 2));
		} else {
			console.error("   Mensaje:", error.message);
		}
	}
}

// Descomenta para crear la reunión real
// createTestMeeting();
