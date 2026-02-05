import axios from "axios";

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.URL_BACKEND || 'http://localhost:3000';
const API_PREFIX = process.env.API_PREFIX || '/api';

async function checkPlatforms() {
    try {
        console.log("🔍 Verificando plataformas de reunión en la base de datos...\n");

        const response = await axios.get(`${API_BASE}${API_PREFIX}/meetings`);

        if (response.data.status === 'success' && response.data.MeetingPlatforms) {
            console.log("✅ Plataformas encontradas:");
            console.log("=" .repeat(60));

            response.data.MeetingPlatforms.forEach((platform, index) => {
                console.log(`\n${index + 1}. ID: ${platform.id}`);
                console.log(`   Nombre: ${platform.name}`);
                console.log(`   Descripción: ${platform.description || 'Sin descripción'}`);
                console.log(`   Activa: ${platform.is_active ? '✅ Sí' : '❌ No'}`);

                // Verificar si el nombre coincide con la búsqueda de Zoom
                const nameLower = platform.name.toLowerCase();
                if (nameLower.includes('zoom')) {
                    console.log(`   ⚠️  Esta plataforma será reconocida como ZOOM ✅`);
                } else if (nameLower.includes('meet') || nameLower.includes('google')) {
                    console.log(`   ⚠️  Esta plataforma será reconocida como GOOGLE MEET ✅`);
                } else {
                    console.log(`   ⚠️  Esta plataforma NO será reconocida automáticamente ❌`);
                }
            });

            console.log("\n" + "=".repeat(60));
            console.log("\n📋 RESUMEN:");
            const zoomPlatform = response.data.MeetingPlatforms.find(p => p.name.toLowerCase().includes('zoom'));
            const meetPlatform = response.data.MeetingPlatforms.find(p => p.name.toLowerCase().includes('meet') || p.name.toLowerCase().includes('google'));

            if (zoomPlatform) {
                console.log(`✅ ZOOM está configurado (ID: ${zoomPlatform.id})`);
            } else {
                console.log(`❌ No hay ninguna plataforma con "Zoom" en el nombre`);
                console.log(`   Para que funcione, el nombre debe contener "zoom" (ej: "Zoom", "ZOOM", "Zoom Video")`);
            }

            if (meetPlatform) {
                console.log(`✅ GOOGLE MEET está configurado (ID: ${meetPlatform.id})`);
            } else {
                console.log(`❌ No hay ninguna plataforma con "Meet" o "Google" en el nombre`);
            }

        } else {
            console.log("❌ No se encontraron plataformas en la base de datos");
            console.log("\n💡 Para crear plataformas, puedes hacer POST a:");
            console.log(`   ${API_BASE}${API_PREFIX}/meeting-platforms`);
            console.log("\nEjemplo:");
            console.log('```json');
            console.log(JSON.stringify({
                name: "Zoom",
                description: "Videoconferencias via Zoom",
                is_active: true
            }, null, 2));
            console.log('```');
        }

    } catch (error) {
        console.error("\n❌ ERROR:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error("   No se pudo conectar al servidor");
            console.error("   Asegúrate de que el backend esté corriendo en:", `${API_BASE}${API_PREFIX}`);
        } else {
            console.error("   Mensaje:", error.message);
        }
    }
}

checkPlatforms();
