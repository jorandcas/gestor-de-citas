// backend/test_email.js

const { sendBrevoEmail } = require('./utils/emailSender'); 
const dotenv = require('dotenv');
dotenv.config();

// -- AÑADE ESTAS LÍNEAS --
console.log(`Clave API leída: ${process.env.BREVO_API_KEY ? 'Sí (Oculta)' : 'NO (Undefined)'}`);
console.log(`Email Remitente leído: ${process.env.BREVO_SENDER_EMAIL}`);

// 2. Definir los parámetros de la prueba
const TEST_RECIPIENT_EMAIL = 'jorand08.cas@gmail.com'; // <--- ¡CÁMBIALO POR TU CORREO!
const TEMPLATE_ID = parseInt(process.env.BREVO_TEMPLATE_ABANDONO);

// Parámetros que la plantilla 'Abandono de Pago' espera:
const testParams = {
    cliente_nombre: 'Prueba de Sistema',
    cita_fecha: 'Miércoles, 10 de Diciembre de 2025',
    cita_hora: '17:00 Hrs (Hora de Puebla)',
    link_mis_citas: 'https://tuapp.com/mis-citas-test'
};

async function runTest() {
    console.log(`\n--- Iniciando prueba de envío con Brevo ---`);
    console.log(`Usando Template ID: ${TEMPLATE_ID}`);
    console.log(`Enviando a: ${TEST_RECIPIENT_EMAIL}`);

    if (!TEMPLATE_ID) {
        console.error("ERROR: El ID de la plantilla (BREVO_TEMPLATE_ABANDONO) no está configurado en .env.");
        return;
    }
    
    // Llamar a la función de envío
    const success = await sendBrevoEmail(
        TEMPLATE_ID, 
        TEST_RECIPIENT_EMAIL, 
        testParams
    );

    if (success) {
        console.log(`\n--- Prueba completada. Revisa el buzón de ${TEST_RECIPIENT_EMAIL}. ---`);
        console.log("Verifica que el contenido dinámico sea correcto.");
    } else {
        console.log("\n--- PRUEBA FALLIDA. Revisa los errores de la consola (arriba) ---");
        console.log("Posibles causas: API Key incorrecta, Correo del Remitente no verificado en Brevo, o Template ID incorrecto.");
    }
}

runTest();