import db from "./database/index.js";
import { ensureMeetLinkForAppointment } from "./utils/meetLinkService.js";
import dotenv from 'dotenv';
dotenv.config();

async function testGenerateMeetLink() {
	console.log("🔗 INTENTANDO GENERAR LINK DE MEET PARA CITAS PENDIENTES...\n");

	try {
		await db.initialize();

		// Buscar citas que necesitan link
		const appointments = await db.Appointment.findAll({
			where: {
				status: 'reservado',
				meeting_link: null
			},
			limit: 3
		});

		console.log(`📋 Found ${appointments.length} appointments needing Meet link\n`);

		for (const apt of appointments) {
			console.log(`\n🔗 Processing Appointment ID: ${apt.id}`);
			console.log(`   Date: ${apt.day}`);
			console.log(`   Time: ${apt.start_time} - ${apt.end_time}`);
			console.log(`   Platform ID: ${apt.meetingPlatformId}`);

			try {
				console.log(`   ⏳ Calling ensureMeetLinkForAppointment...`);
				const result = await ensureMeetLinkForAppointment(apt.id);

				console.log(`   ✅ SUCCESS!`);
				console.log(`   - Link: ${result.link}`);
				console.log(`   - Created: ${result.created}`);

				// Recargar la cita para verificar que se guardó
				const updatedApt = await db.Appointment.findByPk(apt.id);
				console.log(`   - Saved in DB: ${updatedApt.meeting_link ? "✅ YES" : "❌ NO"}`);

			} catch (error) {
				console.error(`   ❌ ERROR:`, error.message);
				console.error(`   Code:`, error.code);
				console.error(`   Stack:`, error.stack);
			}
		}

		console.log("\n✅ Test completed");

	} catch (error) {
		console.error("❌ Fatal error:", error.message);
		console.error(error.stack);
	} finally {
		await db.sequelize.close();
	}
}

testGenerateMeetLink();
