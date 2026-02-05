import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;

console.log("🧪 PRUEBA DE CONEXIÓN CON PAYPAL SANDBOX");
console.log("=".repeat(70));
console.log("\nConfiguración:");
console.log(`  Client ID: ${PAYPAL_CLIENT_ID?.substring(0, 20)}...`);
console.log(`  Client Secret: ${PAYPAL_CLIENT_SECRET ? "***CONFIGURADO***" : "NO CONFIGURADO"}`);
console.log(`  Base URL: ${PAYPAL_BASE_URL}\n`);

async function getAccessToken() {
    try {
        console.log("📡 Paso 1: Obteniendo Access Token...");

        const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET).toString("base64");

        const response = await axios.post(
            `${PAYPAL_BASE_URL}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        console.log("✅ Access Token obtenido correctamente");
        console.log(`   Token: ${response.data.access_token.substring(0, 30)}...`);
        console.log(`   Tipo: ${response.data.token_type}`);
        console.log(`   Expira en: ${response.data.expires_in} segundos\n`);

        return response.data.access_token;
    } catch (error) {
        console.error("\n❌ ERROR obteniendo token:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Message:", error.response.data.error_description || error.response.data.error);
        } else {
            console.error("   Message:", error.message);
        }
        throw error;
    }
}

async function createOrder(accessToken) {
    try {
        console.log("📦 Paso 2: Creando Order de prueba...");

        const response = await axios.post(
            `${PAYPAL_BASE_URL}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        reference_id: "TEST-ORDER-" + Date.now(),
                        amount: {
                            currency_code: "USD",
                            value: "10.00"
                        }
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    "PayPal-Request-Id": "TEST-" + Date.now()
                }
            }
        );

        console.log("✅ Order creado correctamente");
        console.log(`   Order ID: ${response.data.id}`);
        console.log(`   Status: ${response.data.status}`);
        if (response.data.purchase_units && response.data.purchase_units[0]) {
            console.log(`   Amount: ${response.data.purchase_units[0].amount.value} ${response.data.purchase_units[0].amount.currency_code}\n`);
        }

        const approveLink = response.data.links?.find(link => link.rel === "approve");
        if (approveLink) {
            console.log("🔗 Link de aprobación (para pruebas manuales):");
            console.log(`   ${approveLink.href}\n`);
        }

        return response.data.id;
    } catch (error) {
        console.error("\n❌ ERROR creando order:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Details:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("   Message:", error.message);
        }
        throw error;
    }
}

async function main() {
    try {
        const accessToken = await getAccessToken();
        const orderId = await createOrder(accessToken);

        console.log("=".repeat(70));
        console.log("✅ PRUEBA EXITOSA");
        console.log("\n📋 INSTRUCCIONES PARA PROBAR PAGOS:");
        console.log("=".repeat(70));
        console.log("\n1. Ve a: https://developer.paypal.com/dashboard/accounts");
        console.log("2. Inicia sesión con tu cuenta de buyer de sandbox");
        console.log("3. En tu aplicación, selecciona una cita y haz el pago con PayPal");
        console.log("4. Usa las credenciales de la cuenta buyer de sandbox");
        console.log("5. El pago se procesará en modo test (no se cobrará dinero real)\n");
        console.log("💡 IMPORTANTE:");
        console.log("   - Las transacciones en sandbox NO son reales");
        console.log("   - Puedes crear múltiples cuentas de prueba");
        console.log("   - Los fondos son virtuales (simulados)\n");

    } catch (error) {
        console.log("\n❌ PRUEBA FALLIDA");
        console.log("Por favor, verifica tus credenciales de PayPal en el archivo .env");
    }
}

main();
