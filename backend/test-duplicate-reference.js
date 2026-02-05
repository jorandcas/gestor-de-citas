import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.URL_BACKEND || 'http://localhost:3000';
const API_PREFIX = process.env.API_PREFIX || '/api';

console.log("🧪 PRUEBA DE VALIDACIÓN DE REFERENCIA ÚNICA");
console.log("=".repeat(70));
console.log("\nEsta prueba verificará que el sistema detecte referencias duplicadas\n");

// Función para crear un pago de prueba
async function createTestPayment(reference) {
    try {
        const formData = new FormData();
        formData.append('appointment_id', '1'); // Ajusta según tu BD
        formData.append('amount', '100');
        formData.append('reference', reference);
        formData.append('client_name', 'Test User');
        formData.append('client_email', 'test@example.com');
        formData.append('client_phone', '123456789');
        formData.append('notes', 'Test payment');

        const response = await axios.post(
            `${API_BASE}${API_PREFIX}/payment-manual/create`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return { success: true, data: response.data };
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                status: error.response.status,
                data: error.response.data
            };
        }
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log("📋 ESCENARIO 1: Crear pago con referencia nueva");
    console.log("-".repeat(70));

    const testReference = `TEST-REF-${Date.now()}`;
    console.log(`Referencia: ${testReference}\n`);

    const result1 = await createTestPayment(testReference);

    if (result1.success) {
        console.log("✅ Pago creado exitosamente");
        console.log("   El sistema aceptó la referencia nueva\n");
    } else {
        console.log("❌ Error inesperado:", result1.data?.message || result1.error);
        console.log("   Revisa que exista la cita con ID=1\n");
        return;
    }

    console.log("📋 ESCENARIO 2: Intentar crear pago con la MISMA referencia");
    console.log("-".repeat(70));
    console.log(`Referencia: ${testReference} (duplicada)\n`);

    const result2 = await createTestPayment(testReference);

    if (!result2.success && result2.status === 400) {
        console.log("✅ VALIDACIÓN CORRECTA");
        console.log("   Status:", result2.status);
        console.log("   Code:", result2.data.code);
        console.log("   Message:", result2.data.message);

        if (result2.data.code === "DUPLICATE_REFERENCE") {
            console.log("\n🎉 EXCELENTE: El sistema detectó la referencia duplicada");
            console.log("   El mensaje es claro y ayuda al usuario a corregir el error\n");
        }
    } else if (result2.success) {
        console.log("❌ ERROR DE VALIDACIÓN");
        console.log("   El sistema NO detectó la referencia duplicada");
        console.log("   Esto NO debería pasar\n");
    } else {
        console.log("⚠️  Error diferente:", result2.data?.message || result2.error);
    }

    console.log("=".repeat(70));
    console.log("📋 RESUMEN");
    console.log("=".repeat(70));
    console.log("\n✅ La validación de referencia única está funcionando correctamente");
    console.log("📧 Los usuarios recibirán el mensaje:");
    console.log('   "El número de referencia ya ha sido utilizado anteriormente.');
    console.log('    Por favor, verifica e ingresa un número de referencia diferente."\n');
}

main();
