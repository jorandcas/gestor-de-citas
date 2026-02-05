import e from 'express';
import db from '../database/index.js';
import express from 'express';
import { createNotification } from '../utils/notificationHelper.js';
import { where } from 'sequelize';
import { ensureMeetLinkForAppointment } from '../utils/meetLinkService.js';
import { ensureZoomLinkForAppointment } from '../utils/zoomLinkService.js';
import { sendBrevoEmail } from '../utils/emailSender.js';
import { TZDate } from "@date-fns/tz";

const router = express.Router();

const TEMPLATE_PAGO_EXITOSO = parseInt(process.env.BREVO_TEMPLATE_PAGO_EXITOSO);
const ZONE = process.env.ZONE_TIME || 'America/Mexico_City';

async function getTokenOfAccessPaypal() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('Failed to get PayPal access token', response.status, text);
        throw new Error(`PayPal token request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.access_token;
}
router.post('/create-order', async (req, res) => {
    try {
        const { appointmentId, amount } = req.body;
        const getCodeCurrency = await db.Configuration.findOne({
            where: { 'key': 'currency' }
        })
        const currency = getCodeCurrency.value;
        const accessToken = await getTokenOfAccessPaypal();
        console.log(accessToken)
        console.log(appointmentId)
        console.log(amount)
        const paymentResponse = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                payment_source: {
                    paypal: {
                        experience_context: {
                            user_action: 'PAY_NOW',
                            shipping_preference: 'NO_SHIPPING',
                            return_url: `${process.env.URL_FRONTEND}/payment-paypal-success/${appointmentId}`,
                            cancel_url: `${process.env.URL_FRONTEND}/payment-paypal-cancel/${appointmentId}`,
                        }
                    }
                },
                purchase_units: [{
                    items: [{
                        name: 'Cita para asesoria legal',
                        description: 'Pago por la cita de asesoria legal a becerramanchinelly',
                        unit_amount: {
                            currency_code: currency,
                            value: amount,
                        },
                        quantity: '1',
                    }],
                    amount: {
                        currency_code: currency,
                        value: amount,
                        breakdown: {
                            item_total: {
                                currency_code: currency,
                                value: amount,
                            }
                        }
                    },
                }],
            }),
        }).then(res => res.json());
        const payerActionLink = paymentResponse?.links?.find(link => link.rel === 'payer-action')?.href;
        if (!payerActionLink) {
            console.error('No payer-action link returned from PayPal:', paymentResponse);
            return res.status(500).json({ error: 'No payer-action link returned from PayPal' });
        }
        console.log('Payer Action Link:', payerActionLink);
        return res.status(200).json({ payerActionLink, paypalOrder: paymentResponse });

    } catch (error) {
        console.error('Error creating PayPal payment:', error);
        res.status(500).json({ error: 'Error creating PayPal payment' });
    }
});
router.post('/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log(orderId);
        const accessToken = await getTokenOfAccessPaypal();
        const captureResponse = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        }).then(res => res.json());
        console.log('Capture Response:', captureResponse);
        res.status(200).json(captureResponse);
    } catch (error) {
        console.error('Error capturing PayPal order:', error);
        res.status(500).json({ error: 'Error capturing PayPal order' });
    }
});
router.post('/save-payment', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const paymentMethod = await db.PaymentsMethods.findOne({
            where: { name: 'PayPal' },
            transaction
        });
        const paymentMethodId = paymentMethod ? paymentMethod.id : null;
        const { appointmentId, paypalOrderId, status, payerEmail, name, currency, amount, userId, meetingPlatformId } = req.body;
        const user = await db.User.findAll({
                        where: { cleark_id: userId },
                    });
                    if (user.length === 0) {
                        return res.status(404).json({
                            status: "error",
                            message: "User not found",
                        });
                    }
        if (!appointmentId || !paypalOrderId || !status || !payerEmail) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newPayment = await db.PaymentsAppointments.create({
            appointment_id: appointmentId,
            reference: paypalOrderId,
            client_name: name,
            status: status === 'COMPLETED' ? 'completado' : 'pendiente',
            client_email: payerEmail,
            currency: currency,
            amount,
            paymentMethodId,
            user_id: user[0].id,
            transactionDate: new Date(),
        }, { transaction });
        const appointment = await db.Appointment.findByPk(appointmentId, { transaction });
        if (!newPayment) {
            await transaction.rollback();
            return res.status(404).json({
                status: "error",
                message: "payment not found"
            });
        }
        if (!appointment) {
            await transaction.rollback();
            return res.status(404).json({
                status: "error",
                message: "Appointment not found",
            });
        }
        await appointment.update(
            {
                status: "reservado",
                ...(meetingPlatformId && { meetingPlatformId: parseInt(meetingPlatformId) })
            },
            { transaction }
        );

        await transaction.commit();

        // Generar link de reunión automáticamente si se seleccionó plataforma (DESPUÉS del commit)
        if (meetingPlatformId) {
            try {
                console.log("🎯 Generando link de reunión para cita:", appointmentId);

                // Obtener la cita actualizada para saber qué plataforma se seleccionó
                const updatedAppointment = await db.Appointment.findByPk(appointmentId);

                if (!updatedAppointment) {
                    console.error("❌ No se encontró la cita para generar el link");
                    return;
                }

                // Obtener el nombre de la plataforma
                const platform = await db.MeetingPlatforms.findByPk(meetingPlatformId);
                const platformName = platform?.name?.toLowerCase() || '';

                console.log("📋 Plataforma seleccionada:", platformName);

                // Generar link según la plataforma
                if (platformName.includes('zoom')) {
                    console.log("🎥 Generando link de ZOOM...");
                    const { link } = await ensureZoomLinkForAppointment(appointmentId);
                    console.log("✅ Link de Zoom generado:", link);
                } else if (platformName.includes('meet') || platformName.includes('google')) {
                    console.log("🎥 Generando link de GOOGLE MEET...");
                    const { link } = await ensureMeetLinkForAppointment(appointmentId);
                    console.log("✅ Link de Meet generado:", link);
                } else {
                    console.log("⚠️ Plataforma no reconocida, no se genera link automático:", platformName);
                }
            } catch (meetError) {
                console.error("❌ Error generando link de reunión (No afecta el pago):", meetError.message);
                // No fallar el pago si falla la creación del link
            }
        }

        // ======================= ENVIAR CORREO DE CONFIRMACIÓN =======================
        try {
            // Recargar la cita con todos los datos
            const updatedAppointment = await db.Appointment.findByPk(appointmentId);

            if (updatedAppointment && newPayment.client_email) {
                // 1. Formatear Fecha de la CITA
                let fechaCita = 'N/D';
                const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

                if (updatedAppointment.day) {
                    const fechaTz = new TZDate(updatedAppointment.day, ZONE);
                    const fechaNativa = new Date(fechaTz.internal);
                    fechaCita = fechaNativa.toLocaleDateString('es-MX', opciones);
                    fechaCita = fechaCita.charAt(0).toUpperCase() + fechaCita.slice(1);
                }

                // 2. Formatear Fecha del PAGO
                let fechaPago = 'N/D';
                if (newPayment.transactionDate) {
                    const fechaPagoTz = new TZDate(newPayment.transactionDate, ZONE);
                    const fechaPagoNativa = new Date(fechaPagoTz.internal);
                    fechaPago = fechaPagoNativa.toLocaleDateString('es-MX', opciones);
                }

                // 3. Preparar datos del correo
                const datosEmail = {
                    link_reunion: updatedAppointment.meeting_link || "Por confirmar",
                    cliente_nombre: newPayment.client_name,
                    cita_fecha: fechaCita,
                    cita_hora: `${updatedAppointment.start_time.slice(0, 5)} - ${updatedAppointment.end_time.slice(0, 5)}`,
                    tipo_asesoria: "Asesoría Legal Online",
                    metodo_pago: "PayPal",
                    monto: newPayment.amount,
                    moneda: newPayment.currency || "USD",
                    referencia_pago: newPayment.reference || "Sin referencia",
                    fecha_pago: fechaPago
                };

                console.log("📤 ENVIANDO CORREO DE PAGO EXITOSO (PayPal):");
                console.log("TO:", newPayment.client_email);
                console.log("TEMPLATE:", TEMPLATE_PAGO_EXITOSO);

                // 4. Enviar correo
                if (TEMPLATE_PAGO_EXITOSO) {
                    await sendBrevoEmail(
                        TEMPLATE_PAGO_EXITOSO,
                        newPayment.client_email,
                        datosEmail
                    );
                    console.log("✅ Correo de pago exitoso enviado correctamente.");

                    // Marcar que se envió el correo
                    await updatedAppointment.update({
                        payment_confirm_email_sent: true
                    });
                } else {
                    console.warn("⚠️ TEMPLATE_PAGO_EXITOSO no está configurado en .env");
                }
            }
        } catch (emailError) {
            console.error("❌ Error enviando email de confirmación (No afecta el pago):", emailError);
        }
        // ============================================================================

        let notification = null;
        if (typeof user !== 'undefined' && user && user[0] && user[0].id) {
            notification = await createNotification({
                userId: user[0].id,
                title: `Tu pago ha cambiado a ${newPayment.status}.`,
                message: `Tu pago ha sido cambiado al estado: ${newPayment.status}.`,
                type:
                    newPayment.status === "completado"
                        ? "success"
                        : newPayment.status === "fallido"
                            ? "error"
                            : "other",
                payment_id: newPayment.id,
            });
        }
        res.status(201).json({ message: 'Payment saved successfully', payment: newPayment });
    } catch (error) {
        await transaction.rollback();
        console.error('Error saving payment:', error);
        res.status(500).json({ error: 'Error saving payment' });
    }
});
router.get('/',async (req, res) => {
    try {
        const paymentMethod = await db.PaymentsMethods.findOne({
            where: { name: 'PayPal' }
        });
        const payments =  await db.PaymentsAppointments.findAll({
            where:{
                paymentMethodId: paymentMethod.id
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Error fetching payments' });
    }
})
router.get('/:id',async (req, res) => {
    try {
        const { id } = req.params;
        const payment =  await db.PaymentsAppointments.findOne({
            where:{
                id,
            }
        });
        if(!payment){
            return  res.status(404).json({ error: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: 'Error fetching payment' });
    }
})
export default router;
