import db from "../database/index.js";
import { Op } from "sequelize";
import { TZDate } from "@date-fns/tz";

const ZONE = process.env.ZONE_TIME || "America/Mexico_City";

export async function assertUserCanBook(userDbId) {
    const now = new TZDate(new Date(), ZONE);

    const payments = await db.PaymentsAppointments.findAll({
        where: {
            user_id: userDbId,
            status: { [Op.in]: ["pendiente", "completado"] },
        },
        include: [
            {
                model: db.Appointment,
                as: "Appointment",
                where: {
                    status: { [Op.in]: ["reservado", "pendiente_pago"] },
                    isDeleted: false,
                },
                required: true,
            },
        ],
        order: [["createdAt", "DESC"]],
    });

    for (const p of payments) {
        const appt = p.Appointment;
        if (!appt?.day || !appt?.end_time) continue;

        const dayISO = new TZDate(appt.day, ZONE).toISOString().split("T")[0];
        const endDateTime = new TZDate(`${dayISO}T${appt.end_time}`, ZONE);

        if (endDateTime.getTime() > now.getTime()) {
            const err = new Error("USER_HAS_ACTIVE_APPOINTMENT");
            err.code = "USER_HAS_ACTIVE_APPOINTMENT";
            err.details = {
                appointment_id: appt.id,
                day: appt.day,
                start_time: appt.start_time,
                end_time: appt.end_time,
                status: appt.status,
            };
            throw err;
        }
    }
}
