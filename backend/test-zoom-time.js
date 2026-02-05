import axios from "axios";
import moment from "moment-timezone";

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

const TZ = process.env.ZONE_TIME || "America/Mexico_City";

console.log("🧪 PRUEBA DE ZONA HORARIA PARA ZOOM");
console.log("=".repeat(70));
console.log("\nConfiguración:");
console.log(`  Zona horaria del sistema: ${TZ}`);
console.log(`  Fecha/hora actual en ${TZ}: ${moment().tz(TZ).format()}`);
console.log(`  Fecha/hora actual UTC: ${moment().utc().format()}\n`);

// Simular los datos de una cita
const appointmentData = {
	day: "2026-01-28", // Mañana
	start_time: "12:00:00",
	end_time: "13:30:00",
	title: "Cita de Prueba"
};

console.log("📋 DATOS DE LA CITA:");
console.log(`  Fecha: ${appointmentData.day}`);
console.log(`  Hora inicio: ${appointmentData.start_time}`);
console.log(`  Hora fin: ${appointmentData.end_time}\n`);

// Replicar la lógica ACTUALIZADA de zoomLinkService
function buildDateTime(appointmentDay, timeHHMMSS) {
	// appointmentDay viene de la BD como un objeto Date que puede estar en UTC
	// Necesitamos obtener la fecha en el formato correcto para el timezone local

	// Primero convertimos a UTC y luego formateamos para obtener la fecha correcta
	const dateStr = moment.utc(appointmentDay).format("YYYY-MM-DD");

	// Combinar la fecha con la hora en el timezone correcto
	// Esto crea un momento en el timezone especificado
	const result = moment.tz(`${dateStr} ${timeHHMMSS}`, "YYYY-MM-DD HH:mm:ss", TZ);

	return result;
}

const start = buildDateTime(appointmentData.day, appointmentData.start_time);
const end = buildDateTime(appointmentData.day, appointmentData.end_time);

console.log("📅 CÁLCULO DE FECHAS:");
console.log("=".repeat(70));
console.log(`  startTime local: ${start.format()}`);
console.log(`  startTime UTC: ${start.utc().format()}`);
console.log(`  startTime ISO: ${start.toISOString()}`);
console.log(`  startTime para Zoom (local): ${start.format("YYYY-MM-DDTHH:mm:ss")}\n`);

console.log(`  endTime local: ${end.format()}`);
console.log(`  endTime UTC: ${end.utc().format()}`);
console.log(`  endTime ISO: ${end.toISOString()}\n`);

const duration = Math.round(moment(end).diff(moment(start), "minutes"));
console.log(`  Duración: ${duration} minutos\n`);

console.log("🔍 VERIFICACIÓN:");
console.log("=".repeat(70));
console.log(`  ✅ La reunión debería programarse a las: ${start.format("HH:mm")} (${TZ})`);
console.log(`  ✅ Debería terminar a las: ${end.format("HH:mm")} (${TZ})`);
console.log(`  ✅ Duración de: ${duration} minutos\n`);

console.log("📤 DATOS QUE SE ENVÍAN A ZOOM:");
console.log("=".repeat(70));
const startTimeForZoom = start.format("YYYY-MM-DDTHH:mm:ss");
console.log(`  start_time: ${startTimeForZoom}`);
console.log(`  duration: ${duration}`);
console.log(`  timezone: ${TZ}\n`);

console.log("✅ Si la reunión se crea con estos datos, debería aparecer a las");
console.log(`   ${start.format("HH:mm")} ${TZ} en tu dashboard de Zoom.\n`);

// Opcional: Crear la reunión de prueba
async function createTestMeeting() {
	try {
		console.log("🎥 Creando reunión de prueba en Zoom...");

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
				topic: 'TEST - Verificar Zona Horaria',
				type: 2,
				start_time: startTimeForZoom,
				duration: duration,
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

		console.log("✅ REUNIÓN CREADA:");
		console.log("=".repeat(70));
		console.log(`  ID: ${meetingResponse.data.id}`);
		console.log(`  Topic: ${meetingResponse.data.topic}`);
		console.log(`  Start Time: ${meetingResponse.data.start_time}`);
		console.log(`  Duration: ${meetingResponse.data.duration} minutos`);
		console.log(`  Timezone: ${meetingResponse.data.timezone}`);
		console.log(`  Join URL: ${meetingResponse.data.join_url}\n`);

		console.log("🔎 VERIFICA EN TU DASHBOARD DE ZOOM:");
		console.log("   La reunión debería aparecer a las", start.format("HH:mm"), TZ);
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

// Preguntar si queremos crear la reunión real
console.log("⚠️  ¿Quieres crear una reunión de prueba en Zoom para verificar?");
console.log("   Si es así, descomenta la última línea: createTestMeeting();\n");

// createTestMeeting();
