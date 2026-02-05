// backend/utils/emailSender.js
import sib from '@sendinblue/client';
import dotenv from 'dotenv';

dotenv.config();

// 🔐 Variables desde .env
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Soporte';

// Logs de verificación (puedes borrarlos luego)
console.log('--- Verificación en emailSender.js ---');
console.log('BREVO_API_KEY cargada:', !!BREVO_API_KEY);

// Inicializar API de Brevo
const apiInstance = new sib.TransactionalEmailsApi();

// Configurar API KEY
apiInstance.setApiKey(
  sib.TransactionalEmailsApiApiKeys.apiKey,
  BREVO_API_KEY
);

/**
 * Función genérica para enviar correos transaccionales
 * @param {number} templateId - ID de la plantilla en Brevo
 * @param {string} recipientEmail - Correo del destinatario
 * @param {object} params - Parámetros dinámicos para la plantilla
 */
export const sendBrevoEmail = async (templateId, recipientEmail, params = {}) => {
  const sendSmtpEmail = {
    sender: {
      email: SENDER_EMAIL,
      name: SENDER_NAME,
    },
    to: [{ email: recipientEmail }],
    templateId: templateId,
    params: params,
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`📧 Email enviado. Template ${templateId} → ${recipientEmail}`);
    return response;
  } catch (error) {
    console.error('🔴 ERROR COMPLETO DE BREVO:', error);
    if (error?.body) {
      console.error('🔴 BODY ERROR:', error.body);
    }
    return false;
  }
};