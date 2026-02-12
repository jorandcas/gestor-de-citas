import db from "./database/index.js";
import dotenv from 'dotenv';
dotenv.config();

async function testMeetService() {
	console.log("🧪 INICIANDO PRUEBA DE GOOGLE MEET...");
	console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
	console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Configurado" : "❌ NO CONFIGURADO");
	console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ Configurado" : "❌ NO CONFIGURADO");
	console.log("GOOGLE_REFRESH_TOKEN:", process.env.GOOGLE_REFRESH_TOKEN ? "✅ Configurado" : "❌ NO CONFIGURADO");

	try {
		await db.initialize();

		// Buscar el admin
		const admin = await db.User.findOne({
			where: { email: process.env.ADMIN_EMAIL }
		});

		if (!admin) {
			console.log("❌ ERROR: No se encontró el usuario admin con email:", process.env.ADMIN_EMAIL);
			process.exit(1);
		}

		console.log("✅ Usuario admin encontrado:", admin.email);
		console.log("   - hash_google_meet:", admin.hash_google_meet ? "✅ TIENE TOKEN" : "❌ NO TIENE TOKEN");

		if (!admin.hash_google_meet) {
			console.log("\n❌ PROBLEMA ENCONTRADO:");
			console.log("   El admin no tiene un refresh token de Google Meet.");
			console.log("   Debes autorizar la cuenta de Google primero.");
			console.log("\n   Para autorizar:");
			console.log("   1. Inicia sesión en la app como admin");
			console.log("   2. Ve a la configuración de Google OAuth");
			console.log("   3. Autoriza la cuenta de Google Calendar");
			process.exit(1);
		}

		// Verificar si hay citas pendientes sin link
		const appointments = await db.Appointment.findAll({
			where: {
				status: 'reservado',
				meeting_link: null
			},
			limit: 5
		});

		console.log(`\n📋 Citas reservadas sin link de Meet: ${appointments.length}`);

		if (appointments.length === 0) {
			console.log("   ✅ No hay citas pendientes de link");
		} else {
			appointments.forEach((apt, index) => {
				console.log(`   ${index + 1}. Cita ID: ${apt.id}`);
				console.log(`      - Fecha: ${apt.day}`);
				console.log(`      - Hora: ${apt.start_time} - ${apt.end_time}`);
				console.log(`      - Plataforma ID: ${apt.meetingPlatformId}`);
			});
		}

		console.log("\n✅ Prueba completada");

	} catch (error) {
		console.error("❌ Error durante la prueba:", error.message);
		console.error(error.stack);
	} finally {
		await db.sequelize.close();
	}
}

testMeetService();
