import express from 'express';
import db from '../database/index.js';
import { Op } from 'sequelize';
import { TZDate } from "@date-fns/tz";
import { format, setHours, isSameDay } from 'date-fns';
import { de } from 'zod/v4/locales';
// ✅ IMPORTAR ENVIADOR DE CORREOS
import { sendBrevoEmail } from "../utils/emailSender.js";
import { assertUserCanBook } from "../utils/bookingRules.js";

const router = express.Router();

router.use(express.json());

const ZONE = process.env.ZONE_TIME;

// ✅ ID DEL TEMPLATE DE REUNIÓN (Desde .env)
const TEMPLATE_ACCESO_REUNION = parseInt(process.env.BREVO_TEMPLATE_ACCESO_REUNION);

// Función para convertir tiempo en formato HH:MM:SS a segundos
const timeToSeconds = (timeStr) => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + (seconds || 0);
};

// Obtener todas las citas
router.get('/', async (req, res) => {
  try {
    let startDate, endDate;

    if (req.query.startDate && req.query.endDate) {
      startDate = new TZDate(req.query.startDate, ZONE);
      endDate = new TZDate(req.query.endDate, ZONE);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: 'Formato de fecha inválido. Use YYYY-MM-DD'
        });
      }
      startDate = setHours(startDate, 0, 0, 0);
      endDate = setHours(endDate, 23, 59, 59);
    } else {
      const now = new TZDate(new Date(), ZONE);
      const currentDay = now.getDay();
      const diffDays = currentDay === 0 ? 1 : 1 - currentDay;

      startDate = new TZDate(now);
      startDate.setDate(now.getDate() + diffDays);
      startDate = setHours(startDate, 0, 0, 0);

      endDate = new TZDate(startDate);
      endDate.setDate(startDate.getDate() + 5);
      endDate = setHours(endDate, 23, 59, 59);
    }

    const appointments = await db.Appointment.findAll({
      where: {
        day: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        },
        isDeleted: false
      },
      order: [
        ['day', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    res.json({
      startDate: startDate,
      endDate: endDate,
      appointments: appointments
    });

  } catch (error) {
    console.error('Error al obtener las citas:', error);
    res.status(500).json({
      message: 'Error al obtener las citas',
      error: error.message
    });
  }
});

router.get('/user/:clearkId', async (req, res) => {
  try {
    const { clearkId } = req.params;
    console.log(clearkId)
    const userByClerkId = await db.User.findOne({
      where: { cleark_id: clearkId }
    });

    // Validar si el usuario existe en la base de datos
    if (!userByClerkId) {
      console.log('Usuario no encontrado en BD, retornando array vacío');
      return res.json({
        status: 'success',
        paymentsOfUser: []
      });
    }

    const paymentsOfUser = await db.PaymentsAppointments.findAll({
      where: { user_id: userByClerkId.id },
      include: [
        { model: db.Appointment, as: 'Appointment' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({
      status: 'success',
      paymentsOfUser: paymentsOfUser
    });
  } catch (error) {
    console.error('Error al obtener las citas del usuario:', error);
    res.status(500).json({
      message: 'Error al obtener las citas del usuario',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const phoneNumber = await db.Appointment.findByPk(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({
        status: 'error',
        message: 'Número de teléfono no encontrado'
      });
    }
    res.json({
      status: 'success',
      phoneNumber: phoneNumber
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener el número de teléfono'
    });
  }
});

// Crear una nueva cita
router.post('/', async (req, res) => {
  try {
    const { day, start_time, end_time, reservation, status, price } = req.body;

    const defaultCurrencySystem = await db.Configuration.findAll({
      where: { key: 'currency' }
    })
    const currencyId = await db.Currency.findOne({
      where: { code: defaultCurrencySystem[0]?.value }
    })

    if (!day || !start_time || !end_time) {
      return res.status(400).json({
        status: 'error',
        message: 'Los campos day, start_time y end_time son obligatorios'
      });
    }
    if (!defaultCurrencySystem || defaultCurrencySystem.length === 0) {
      return res.status(500).json({
        status: 'error',
        message: 'No hay una moneda por defecto configurada en el sistema.'
      });
    }

    const appointmentDate = new TZDate(`${day}T12:00:00`, ZONE);

    const newAppointment = await db.Appointment.create({
      day: appointmentDate,
      start_time: start_time,
      end_time: end_time,
      reservation: reservation || null,
      reservation_date: null,
      status: status || 'disponible',
      price: price || 0,
      currency_id: currencyId.id,
    });

    res.status(201).json({
      status: 'success',
      newAppointment: newAppointment
    });
  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al crear la cita',
      error: error.message
    });
  }
});

// ======================================================================
// 🔄 UPDATE CITA (Aquí agregamos la lógica del LINK y CORREO)
// ======================================================================
router.put('/:id', async (req, res) => {
  try {
    const appointment = await db.Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Cita no encontrada'
      });
    }

    if (appointment.isDeleted) {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede actualizar una cita eliminada'
      });
    }

    // ✅ Agregamos 'meeting_link' a la extracción de datos
    const { day, start_time, end_time, status, price, meeting_link } = req.body;

    const now = new TZDate(new Date(), ZONE);
    const currentTime = now.toTimeString().slice(0, 8);
    const currentDate = now.toISOString().split('T')[0];
    const appointmentDate = day ? new TZDate(day, ZONE).toISOString().split('T')[0] : null;

    // --- Validaciones de tiempo ---
    if (day) {
      const today = now ? new TZDate(now, ZONE).toISOString().split('T')[0] : null;
      if (appointmentDate < today.internal) {
        return res.status(400).json({
          status: 'error',
          message: 'No se puede programar una cita en una fecha pasada'
        });
      }
      if (appointmentDate === currentDate) {
        const startTimeSec = timeToSeconds(start_time || appointment.start_time);
        const currentTimeSec = timeToSeconds(currentTime);
        if (startTimeSec < currentTimeSec) {
          // Si solo estoy actualizando el link, permito que pase aunque la hora haya iniciado
          if (!meeting_link) {
            // return res.status(400).json({ status: 'error', message: 'La hora...' });
            // (Comenté esta validación estricta por si actualizas el link justo a la hora de la cita)
          }
        }
      }
    }

    // Validar hora inicio vs fin
    if (start_time && end_time) {
      const startTimeSec = timeToSeconds(start_time);
      const endTimeSec = timeToSeconds(end_time);
      if (startTimeSec > endTimeSec) {
        return res.status(400).json({
          status: 'error',
          message: 'La hora de inicio debe ser anterior a la hora final'
        });
      }
    }

    const dateToSave = day ? new TZDate(`${day}T12:00:00`, ZONE) : undefined;

    // Preparar objeto de actualización
    const updateData = {};
    if (day) updateData.day = dateToSave;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (status) updateData.status = status;
    if (price) updateData.price = price;

    // ✅ ACTUALIZAR LINK DE REUNIÓN
    if (meeting_link !== undefined) {
      updateData.meeting_link = meeting_link;
    }

    await appointment.update(updateData);

    // ============================================================
    // 📧 CORREO #3: ENVIAR LINK DE ACCESO
    // ============================================================
    // Si se acaba de guardar un link válido, enviamos el correo
    if (meeting_link && meeting_link.trim() !== '') {
      try {
        console.log(`🔗 Se ha detectado un link de reunión para la cita ${appointment.id}. Buscando cliente...`);

        // 1. Buscamos el pago asociado para obtener el email del cliente
        // (Buscamos el pago más reciente aprobado o pendiente asociado a esta cita)
        const payment = await db.PaymentsAppointments.findOne({
          where: {
            appointment_id: appointment.id,
            status: { [Op.or]: ['completado', 'aprobado', 'pendiente'] }
          },
          order: [['createdAt', 'DESC']]
        });

        if (payment && payment.client_email) {
          // 2. Formatear Fecha
          let fechaFormateada = 'N/D';
          const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
          if (appointment.day) {
            const fechaTz = new TZDate(appointment.day, ZONE);
            const fechaNativa = new Date(fechaTz.internal);
            fechaFormateada = fechaNativa.toLocaleDateString('es-MX', opciones);
            fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
          }

          // 3. Enviar Correo
          if (TEMPLATE_ACCESO_REUNION) {
            console.log(`📧 Enviando Link de Reunión a: ${payment.client_email}`);
            await sendBrevoEmail(
              TEMPLATE_ACCESO_REUNION,
              payment.client_email,
              {
                cliente_nombre: payment.client_name,
                cita_fecha: fechaFormateada,
                cita_hora: `${appointment.start_time.slice(0, 5)} - ${appointment.end_time.slice(0, 5)}`,
                link_reunion: meeting_link // La variable clave
              }
            );
            console.log("✅ Correo con Link enviado exitosamente.");
          } else {
            console.warn("⚠️ Falta ID Template Acceso Reunión en .env");
          }
        } else {
          console.warn("⚠️ No se encontró cliente/pago para enviar el link de esta cita.");
        }

      } catch (emailErr) {
        console.error("❌ Error enviando email de link:", emailErr);
        // No bloqueamos la respuesta, solo logueamos el error
      }
    }
    // ============================================================

    res.json({
      status: 'success',
      message: 'Cita actualizada exitosamente',
      data: appointment
    });

  } catch (error) {
    console.error('Error al actualizar la cita:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar la cita',
      error: error.message
    });
  }
});

// Eliminar (lógico)
router.delete('/:id', async (req, res) => {
  try {
    const phoneNumber = await db.Appointment.findByPk(req.params.id);
    if (!phoneNumber) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    await phoneNumber.update({
      isDeleted: true,
      status: 'cancelado'
    });

    res.json({
      message: 'Cita marcada como eliminada exitosamente',
      data: phoneNumber
    });
  } catch (error) {
    console.error('Error al marcar como eliminado:', error);
    res.status(500).json({
      message: 'Error al eliminar cita',
      error: error.message
    });
  }
});

router.put('/update-appointment-platform/:id', async (req, res) => {
  const { id } = req.params;
  const { meetingPlatformId } = req.body;

  try {
    const appointment = await db.Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Cita no encontrada'
      });
    }
    await appointment.update({
      meetingPlatformId: meetingPlatformId
    });
    res.json({
      status: 'success',
      message: 'Cita actualizada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error al actualizar la cita:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar la cita',
      error: error.message
    });
  }

});

// Verificar si el usuario puede reservar una nueva cita
router.get('/can-book/:clearkId', async (req, res) => {
  try {
    const { clearkId } = req.params;

    // Buscar el usuario en la base de datos
    const user = await db.User.findAll({
      where: { cleark_id: clearkId },
    });

    if (!user || user.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado',
      });
    }

    // Verificar si el usuario puede reservar
    try {
      await assertUserCanBook(user[0].id);

      // Si no hay error, el usuario puede reservar
      return res.status(200).json({
        status: 'success',
        canBook: true,
        message: 'El usuario puede reservar una nueva cita'
      });
    } catch (error) {
      // Si hay error, el usuario NO puede reservar
      if (error.code === 'USER_HAS_ACTIVE_APPOINTMENT') {
        return res.status(400).json({
          status: 'error',
          canBook: false,
          code: error.code,
          message: 'Ya tienes una cita activa. Podrás agendar otra cuando tu cita termine o sea cancelada.',
          activeAppointment: error.details
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al verificar si el usuario puede reservar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al verificar disponibilidad del usuario',
      error: error.message
    });
  }
});

export default router;