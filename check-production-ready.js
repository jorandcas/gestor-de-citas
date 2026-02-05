#!/usr/bin/env node

/**
 * Script de verificación antes del despliegue a producción
 * Ejecutar: node check-production-ready.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const checks = [];

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function check(description, pass, details = '') {
  checks.push({ description, pass, details });
  const icon = pass ? '✅' : '❌';
  const color = pass ? 'green' : 'red';
  log(`${icon} ${description}`, color);
  if (details && !pass) {
    log(`   ${details}`, 'yellow');
  }
}

function warn(description, details) {
  checks.push({ description, pass: null, details });
  log(`⚠️  ${description}`, 'yellow');
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Verificar archivos necesarios
log('\n📋 Verificando archivos necesarios...\n', 'blue');

check(
  'Dockerfile del backend existe',
  fs.existsSync(path.join(__dirname, 'backend/Dockerfile')),
  'Falta: backend/Dockerfile'
);

check(
  'Dockerfile del frontend existe',
  fs.existsSync(path.join(__dirname, 'frontend/Dockerfile')),
  'Falta: frontend/Dockerfile'
);

check(
  'package.json del backend existe',
  fs.existsSync(path.join(__dirname, 'backend/package.json')),
  'Falta: backend/package.json'
);

check(
  'package.json del frontend existe',
  fs.existsSync(path.join(__dirname, 'frontend/package.json')),
  'Falta: frontend/package.json'
);

check(
  '.env.production.example del backend',
  fs.existsSync(path.join(__dirname, 'backend/.env.production.example')),
  'Falta: backend/.env.production.example'
);

check(
  '.env.production.example del frontend',
  fs.existsSync(path.join(__dirname, 'frontend/.env.production.example')),
  'Falta: frontend/.env.production.example'
);

// Verificar configuración
log('\n⚙️  Verificando configuración...\n', 'blue');

try {
  const backendPackage = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'backend/package.json'), 'utf-8')
  );

  check(
    'Backend tiene script "start"',
    !!backendPackage.scripts.start,
    'Agregar "start": "node index.js" a scripts'
  );

  check(
    'Backend tiene script "migration"',
    !!backendPackage.scripts.migration,
    'Agregar script de migración a package.json'
  );

  const frontendPackage = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'frontend/package.json'), 'utf-8')
  );

  check(
    'Frontend tiene script "build"',
    !!frontendPackage.scripts.build,
    'Agregar "build": "tsc -b && vite build" a scripts'
  );
} catch (error) {
  log('❌ Error al leer package.json: ' + error.message, 'red');
}

// Verificar .env files
log('\n🔐 Verificando variables de entorno...\n', 'blue');

const backendEnvPath = path.join(__dirname, 'backend/.env');
if (fs.existsSync(backendEnvPath)) {
  warn(
    'Existe backend/.env',
    'Este archivo debería estar en .gitignore. Usa .env.production.example como plantilla.'
  );

  const envContent = fs.readFileSync(backendEnvPath, 'utf-8');
  const requiredVars = [
    'NODE_ENV',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'URL_BACKEND',
    'URL_FRONTEND',
    'FRONTEND_URL',
    'CLERK_SECRET_KEY',
    'ADMIN_EMAIL',
  ];

  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=`);
    return !regex.test(envContent);
  });

  if (missingVars.length > 0) {
    warn(
      'Faltan variables de entorno requeridas',
      `Faltan: ${missingVars.join(', ')}`
    );
  }
} else {
  check(
    'No existe backend/.env',
    true,
    'Correcto: Usa .env.production.example como plantilla'
  );
}

// Verificar estructura de directorios
log('\n📁 Verificando estructura de directorios...\n', 'blue');

check(
  'Directorio backend/routes existe',
  fs.existsSync(path.join(__dirname, 'backend/routes')),
  'Crear: backend/routes'
);

check(
  'Directorio backend/database existe',
  fs.existsSync(path.join(__dirname, 'backend/database')),
  'Crear: backend/database con migraciones y modelos'
);

check(
  'Directorio backend/uploads existe o está en .gitignore',
  !fs.existsSync(path.join(__dirname, 'backend/uploads')) ||
    fs.readFileSync(path.join(__dirname, 'backend/.gitignore'), 'utf-8').includes('uploads/*'),
  'Agregar uploads/* a backend/.gitignore'
);

// Verificar Dockerfiles
log('\n🐳 Verificando Dockerfiles...\n', 'blue');

try {
  const backendDockerfile = fs.readFileSync(
    path.join(__dirname, 'backend/Dockerfile'),
    'utf-8'
  );

  check(
    'Backend Dockerfile expone puerto 3000',
    backendDockerfile.includes('EXPOSE 3000'),
    'Agregar "EXPOSE 3000" al Dockerfile'
  );

  check(
    'Backend Dockerfile usa node:20-alpine',
    backendDockerfile.includes('FROM node:20-alpine'),
    'Usar imagen node:20-alpine para producción'
  );

  const frontendDockerfile = fs.readFileSync(
    path.join(__dirname, 'frontend/Dockerfile'),
    'utf-8'
  );

  check(
    'Frontend Dockerfile es multi-stage',
    frontendDockerfile.includes('AS builder') && frontendDockerfile.includes('nginx:alpine'),
    'Usar multi-stage build con Nginx para mejor performance'
  );

  check(
    'Frontend Dockerfile expone puerto 80',
    frontendDockerfile.includes('EXPOSE 80'),
    'Agregar "EXPOSE 80" al Dockerfile'
  );
} catch (error) {
  log('❌ Error al leer Dockerfiles: ' + error.message, 'red');
}

// Verificar gitignore
log('\n🙈 Verificando .gitignore...\n', 'blue');

const gitignorePath = path.join(__dirname, 'backend/.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

  check(
    'backend/.gitignore incluye node_modules',
    gitignore.includes('node_modules/'),
    'Agregar node_modules/ a .gitignore'
  );

  check(
    'backend/.gitignore incluye .env',
    gitignore.includes('.env'),
    'Agregar .env a .gitignore'
  );

  check(
    'backend/.gitignore incluye uploads',
    gitignore.includes('uploads/*'),
    'Agregar uploads/* a .gitignore'
  );
}

// Resumen
log('\n' + '='.repeat(60) + '\n', 'blue');

const passed = checks.filter(c => c.pass === true).length;
const failed = checks.filter(c => c.pass === false).length;
const warnings = checks.filter(c => c.pass === null).length;

log(`✅ Pasaron: ${passed}`, 'green');
log(`❌ Fallaron: ${failed}`, failed > 0 ? 'red' : 'reset');
log(`⚠️  Advertencias: ${warnings}`, 'yellow');

if (failed === 0 && warnings === 0) {
  log('\n🎉 ¡Todo está listo para producción!\n', 'green');
  process.exit(0);
} else if (failed === 0) {
  log('\n✅ Listo para desplegar, pero revisa las advertencias.\n', 'yellow');
  process.exit(0);
} else {
  log('\n❌ Por favor corrige los errores antes de desplegar.\n', 'red');
  process.exit(1);
}
