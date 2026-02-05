import axios from "axios";

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

console.log("🔍 Probando credenciales de Zoom:");
console.log("Account ID:", ZOOM_ACCOUNT_ID);
console.log("Client ID:", ZOOM_CLIENT_ID);
console.log("Client Secret:", ZOOM_CLIENT_SECRET ? "***OCULTO***" : "NO CONFIGURADO");

async function testZoomAPI() {
    try {
        console.log("\n📡 Paso 1: Obteniendo access token...");

        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            null,
            {
                auth: {
                    username: ZOOM_CLIENT_ID,
                    password: ZOOM_CLIENT_SECRET,
                },
            }
        );

        const accessToken = response.data.access_token;
        console.log("✅ Access token obtenido:", accessToken.substring(0, 20) + "...");

        console.log("\n📡 Paso 2: Creando reunión de prueba...");

        const meetingResponse = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: 'Prueba de API Zoom',
                type: 2,
                start_time: new Date(Date.now() + 3600000).toISOString(),
                duration: 30,
                timezone: 'America/Mexico_City',
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                },
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log("✅ Reunión creada exitosamente:");
        console.log("   ID:", meetingResponse.data.id);
        console.log("   Join URL:", meetingResponse.data.join_url);
        console.log("\n🎉 ¡Todo funciona correctamente!");

    } catch (error) {
        console.error("\n❌ ERROR:");

        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("   Mensaje:", error.message);
        }
    }
}

testZoomAPI();
