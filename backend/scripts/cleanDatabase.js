import db from "../database/index.js";
import dotenv from 'dotenv';
dotenv.config();

const cleanDatabase = async () => {
	console.log("🧹 INICIANDO LIMPIEZA DE BASE DE DATOS...");
	console.log("⚠️  ADVERTENCIA: Esto eliminará TODOS los pagos y citas");

	try {
		// Iniciar transacción para seguridad
		const transaction = await db.sequelize.transaction();

		try {
			// 1. Eliminar notificaciones relacionadas con pagos
			const deletedNotifications = await db.Notification.destroy({
				where: {
					payment_id: { [db.Sequelize.Op.ne]: null }
				},
				transaction
			});
			console.log(`✅ ${deletedNotifications} notificaciones eliminadas`);

			// 2. Eliminar imágenes de pagos
			const deletedImages = await db.PaymentImages.destroy({
				truncate: true,
				transaction
			});
			console.log(`✅ ${deletedImages} imágenes de pagos eliminadas`);

			// 3. Eliminar todos los pagos
			const deletedPayments = await db.PaymentsAppointments.destroy({
				truncate: true,
				transaction
			});
			console.log(`✅ ${deletedPayments} pagos eliminados`);

			// 4. Eliminar todas las citas
			const deletedAppointments = await db.Appointment.destroy({
				truncate: true,
				transaction
			});
			console.log(`✅ ${deletedAppointments} citas eliminadas`);

			// Commit de la transacción
			await transaction.commit();
			console.log("🎉 LIMPIEZA COMPLETADA EXITOSAMENTE");

			// Mostrar conteos finales
			const notificationsCount = await db.Notification.count();
			const imagesCount = await db.PaymentImages.count();
			const paymentsCount = await db.PaymentsAppointments.count();
			const appointmentsCount = await db.Appointment.count();

			console.log("\n📊 CONTEOS FINALES:");
			console.log(`   - Notificaciones: ${notificationsCount}`);
			console.log(`   - Imágenes de pagos: ${imagesCount}`);
			console.log(`   - Pagos: ${paymentsCount}`);
			console.log(`   - Citas: ${appointmentsCount}`);

		} catch (error) {
			await transaction.rollback();
			throw error;
		}

	} catch (error) {
		console.error("❌ Error durante la limpieza:", error.message);
		process.exit(1);
	} finally {
		await db.sequelize.close();
	}
};

// Ejecutar la limpieza
cleanDatabase();
