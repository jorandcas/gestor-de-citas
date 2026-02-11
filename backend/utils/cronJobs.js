// backend/utils/cronJobs.js

import cron from 'node-cron';
import moment from 'moment-timezone';
import { sendBrevoEmail } from './emailSender.js';
import db from '../database/index.js';

const TZ = process.env.ZONE_TIME || 'America/Mexico_City';
const TEMPLATE_ABANDONO = parseInt(process.env.BREVO_TEMPLATE_ABANDONO) || 2;

/**
 * TAREA 1: Completar Citas
 */
async function checkAndMarkCompleted() {
    console.log('--- CRON: Revisando citas para completar ---');
    const now = moment().tz(TZ);
    try {
        const appointmentsToComplete = await db.Appointment.findAll({ where: { status: 'reservado' } });
        for (const appointment of appointmentsToComplete) {
            const date = moment(appointment.day).format("YYYY-MM-DD");
            const appointmentEnd = moment.tz(`${date} ${appointment.end_time}`, TZ);
            if (appointmentEnd.isBefore(now)) {
                await appointment.update({ status: "completado" });
            }
        }
    } catch (err) {
        console.error("❌ Error completando citas:", err);
    }
}

/**
 * TAREA 2: Abandono de Carrito
 */
async function checkAppointmentsAndSendEmails() {
    console.log('--- 🔎 DEBUG CRON: Iniciando revisión ---');
    const now = moment().tz(TZ);
    const Op = db.Sequelize.Op;

    try {
        const sixtyMinAgo = now.clone().subtract(60, "minutes").toDate();

        // Buscamos pagos pendientes viejos
        const abandonedPayments = await db.PaymentsAppointments.findAll({
            where: {
                status: "pendiente",
                createdAt: { [Op.lte]: sixtyMinAgo }
            },
            include: [{
                model: db.Appointment,
                as: "Appointment",
                required: true,
            }]
        });

        console.log(`📊 Pagos encontrados: ${abandonedPayments.length}`);

        for (const payment of abandonedPayments) {
            const appt = payment.Appointment || payment.appointment;

            // Validaciones para no repetir
            if (!appt) continue;
            if (appt.abandonment_email_sent) {
                console.log(`⚠️ Cita ${appt.id} ya fue procesada. Saltando.`);
                continue;
            }

            console.log(`🚀 Procesando Pago ID: ${payment.id} | Cliente: ${payment.client_email}`);

            const fechaCita = moment.tz(`${appt.day} ${appt.start_time}`, TZ);

            // 1. ENVIAR CORREO (Ya confirmamos que esto funciona)
            await sendBrevoEmail(
                TEMPLATE_ABANDONO,
                payment.client_email,
                {
                    cliente_nombre: payment.client_name,
                    cita_fecha: fechaCita.format("DD/MM/YYYY"),
                    cita_hora: fechaCita.format("HH:mm"),
                    link_mis_citas: `${process.env.FRONTEND_URL}/mis-citas`
                }
            );

            // 2. ACTUALIZAR BASE DE DATOS (¡ESTO ES LO CRÍTICO!)
            try {
                await payment.update({ status: "expirado" });
                console.log(`✅ BD ACTUALIZADA: Pago ${payment.id} marcado como 'expirado'.`);

                await appt.update({
                    status: "disponible",
                    abandonment_email_sent: true
                });
                console.log(`✅ BD ACTUALIZADA: Cita ${appt.id} liberada.`);

            } catch (dbError) {
                console.error(`❌ ERROR al guardar en BD para pago ${payment.id}:`, dbError);
            }
        }

    } catch (err) {
        console.error("❌ Error general en cron de abandono:", err);
    }
}

export const startCronJobs = () => {
    console.log(`⚙️ Cron Jobs activos - MODO DEBUG (Cada 5 minuto)`);

    cron.schedule("0 */5 * * * *", checkAndMarkCompleted, { scheduled: true, timezone: TZ });

    // Ejecutar cada 30 minutos
    cron.schedule("*/30 * * * *", checkAppointmentsAndSendEmails, { scheduled: true, timezone: TZ });
};