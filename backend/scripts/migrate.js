#!/usr/bin/env node

/**
 * Script de ayuda para ejecutar migraciones
 * Uso: node scripts/migrate.js
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('🔄 Ejecutando migraciones de base de datos...\n');

try {
  // Verificar que las variables de entorno necesarias estén configuradas
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Faltan variables de entorno requeridas:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPor favor configura tu archivo .env');
    process.exit(1);
  }

  console.log('📋 Configuración de base de datos:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}\n`);

  console.log('⏳ Ejecutando migraciones...');

  // Ejecutar migraciones con Sequelize
  execSync('npx sequelize-cli db:migrate', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n✅ Migraciones ejecutadas exitosamente!\n');

  // Preguntar si se quieren ejecutar los seeders
  console.log('💡 ¿Deseas ejecutar los seeders (datos iniciales)?');
  console.log('   Esto poblará la base de datos con datos iniciales (monedas, métodos de pago, etc.)');
  console.log('   Para ejecutar manualmente: npm run seed\n');

} catch (error) {
  console.error('\n❌ Error al ejecutar migraciones:');
  console.error(error.message);
  process.exit(1);
}
