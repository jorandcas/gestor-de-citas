# Plan de Despliegue a Producción - Gestor de Citas

## 📋 Resumen del Proyecto

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Sequelize ORM
- **Base de Datos**: MySQL
- **Autenticación**: Clerk
- **Pagos**: Stripe + PayPal
- **Email**: Brevo/SendinBlue
- **Videoconferencias**: Google Meet, Zoom, Teams
- **Infraestructura**: Hetzner + Coolify

---

## 🎯 Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────┐
│                        COOLIFY                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   FRONTEND   │  │   BACKEND    │  │    MYSQL     │      │
│  │   (Nginx)    │  │  (Node.js)   │  │  Database    │      │
│  │   Port: 80   │  │   Port: 3000 │  │   Port: 3306 │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                        │                                     │
│                   ┌─────┴─────┐                              │
│                   │  VOLUMEN   │                              │
│                   │  uploads/  │                              │
│                   └───────────┘                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   DOMINIO + HTTPS   │
              │   (Traefik/Caddy)   │
              └─────────────────────┘
```

---

## 📝 Pre-requisitos

### 1. En Hetzner
- [ ] Servidor Cloud (mínimo 4GB RAM, 2 CPU)
- [ ] IP pública estática
- [ ] Dominio configurado apuntando a la IP

### 2. En Coolify
- [ ] Coolify instalado en el servidor
- [ ] Acceso al panel de administración
- [ ] Proyecto creado

### 3. Servicios Externos
- [ ] Cuenta Clerk (producción)
- [ ] Cuenta Stripe (producción)
- [ ] Cuenta PayPal (producción)
- [ ] Cuenta Brevo/SendinBlue
- [ ] Cuenta Google Cloud (Meet)
- [ ] Cuenta Zoom (opcional)

---

## 🔧 Pasos del Despliegue

### PASO 1: Preparar Repositorio

1. **Subir código a Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Production ready"
   git remote add origin <TU_REPOSITORIO_GIT>
   git push -u origin main
   ```

2. **Verificar archivos críticos**
   - ✅ `backend/Dockerfile` existe
   - ✅ `frontend/Dockerfile` existe
   - ✅ `backend/package.json` correcto
   - ✅ `frontend/package.json` correcto

### PASO 2: Configurar Base de Datos MySQL

**Opción A: Usar MySQL de Coolify (Recomendado)**

1. En Coolify, crear un nuevo servicio:
   - Tipo: Database
   - Motor: MySQL
   - Versión: 8.0
   - Nombre: `gestor-citas-db`

2. Configurar credenciales:
   - Usuario: `gestor_citas_user`
   - Contraseña: (generar una segura)
   - Base de datos: `gestor_citas_prod`

3. Coolify generará las variables de entorno automáticamente.

**Opción B: MySQL Externo**

Si usas un servidor MySQL externo (ej. Hetzner Cloud DB):

```bash
# Variables de entorno
DB_HOST=tu-mysql-server.com
DB_PORT=3306
DB_NAME=gestor_citas_prod
DB_USER=gestor_citas_user
DB_PASSWORD=tu_contraseña_segura
```

### PASO 3: Desplegar Backend

1. **Crear aplicación en Coolify**:
   - Repositorio: Tu repo de Git
   - Rama: `main`
   - Ruta del Dockerfile: `backend/Dockerfile`
   - Puerto: 3000

2. **Configurar volúmenes persistentes**:
   - Montar volumen en: `/app/uploads`
   - Tipo: Volume (Coolify managed)
   - Nombre: `backend-uploads`

3. **Variables de Entorno del Backend**:

```bash
# === CONFIGURACIÓN DEL SERVIDOR ===
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# === BASE DE DATOS ===
DB_HOST=gestor-citas-db  # Si es MySQL de Coolify
DB_PORT=3306
DB_NAME=gestor_citas_prod
DB_USER=gestor_citas_user
DB_PASSWORD=<CONTRASEÑA_DB>

# === URLs DE LA APLICACIÓN ===
URL_BACKEND=https://api.tu-dominio.com
URL_FRONTEND=https://tu-dominio.com
FRONTEND_URL=https://tu-dominio.com

# === CLERK (AUTENTICACIÓN) ===
CLERK_WEBHOOK_SECRET=whsec_xxx
CLERK_SECRET_KEY=sk_live_xxx
ADMIN_EMAIL=tu@email.com

# === PAYPAL ===
PAYPAL_CLIENT_ID=Axjxxxx
PAYPAL_CLIENT_SECRET=EJxxxx
PAYPAL_BASE_URL=https://api-m.paypal.com

# === STRIPE ===
STRIPE_SECRET_KEY=sk_live_xxx

# === GOOGLE MEET ===
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://api.tu-dominio.com/api/generate-link/oauth2callback

# === ZOOM (opcional) ===
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx

# === BREVO (EMAIL) ===
BREVO_API_KEY=xkeysib-xxx
BREVO_SENDER_EMAIL=noreply@tu-dominio.com
BREVO_SENDER_NAME=Tu App
BREVO_TEMPLATE_ABANDONO=2
BREVO_TEMPLATE_CONFIRMACION_MANUAL=3
BREVO_TEMPLATE_PAGO_EXITOSO=4
BREVO_TEMPLATE_ACCESO_REUNION=5

# === ZONA HORARIA ===
ZONE_TIME=America/Mexico_City
```

4. **Script de inicio personalizado** (opcional):

En `package.json`, agregar script de migración:
```json
"scripts": {
  "start": "node index.js",
  "migrate": "npx sequelize-cli db:migrate"
}
```

O configurar en Coolify para ejecutar migraciones automáticamente.

### PASO 4: Desplegar Frontend

1. **Crear aplicación en Coolify**:
   - Repositorio: Tu repo de Git
   - Rama: `main`
   - Ruta del Dockerfile: `frontend/Dockerfile`
   - Puerto: 80

2. **Variables de Entorno del Frontend**:

```bash
# Estas variables se inyectan durante el build
VITE_API_URL=https://api.tu-dominio.com
```

3. **Configurar dominio**:
   - Dominio principal: `tu-dominio.com`
   - Coolify configurará HTTPS automáticamente

### PASO 5: Configurar Dominios y Proxy

**Backend API**:
- Dominio: `api.tu-dominio.com`
- Redirigir a servicio Backend (puerto 3000)
- HTTPS automático con Traefik/Caddy de Coolify

**Frontend**:
- Dominio: `tu-dominio.com`
- Redirigir a servicio Frontend (puerto 80)
- HTTPS automático

### PASO 6: Ejecutar Migraciones de Base de Datos

Opción 1: Desde el panel de Coolify
- Ir a la aplicación Backend
- Abrir terminal web
- Ejecutar: `npm run migration`

Opción 2: SSH al servidor
```bash
docker exec -it <backend-container-id> npm run migration
```

Opción 3: Agregar al Dockerfile
```dockerfile
# Agregar antes de CMD
RUN npx sequelize-cli db:migrate || true
```

### PASO 7: Configurar Webhooks Externos

**Clerk Webhook**:
1. Ir al panel de Clerk → Settings → Webhooks
2. Agregar endpoint: `https://api.tu-dominio.com/api/webhooks/clerk`
3. Copiar secret y configurar en `CLERK_WEBHOOK_SECRET`

**Stripe Webhook** (si se usa):
1. Stripe Dashboard → Webhooks
2. Endpoint: `https://api.tu-dominio.com/api/webhooks/stripe`
3. Seleccionar eventos: `payment_intent.succeeded`, `payment_intent.failed`

**PayPal Webhook** (si se usa):
1. PayPal Developer → Webhooks
2. Endpoint: `https://api.tu-dominio.com/api/webhooks/paypal`

---

## 🔐 Consideraciones de Seguridad

### 1. Variables Sensibles
- Usar variables de entorno de Coolify
- Nunca commitear `.env` files
- Rotar contraseñas regularmente

### 2. CORS
El backend tiene CORS configurado para `origin: '*'`. En producción, restringir:

```javascript
// En backend/index.js
app.use(cors({
  origin: ['https://tu-dominio.com', 'https://api.tu-dominio.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Helmet
Ya configurado en backend, verificar que sea producción:

```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

### 4. Base de Datos
- Usar contraseñas fuertes
- Restringir acceso por IP
- Habilitar SSL en MySQL

---

## 📦 Volúmenes Persistentes

### Backend - Uploads
```
Nombre: backend-uploads
Ruta: /app/uploads
Propósito: Imágenes de comprobantes de pago
```

### Backup de Base de Datos
Configurar backups automáticos en Coolify:
- Frecuencia: Diaria
- Retención: 7 días
- Destino: S3 o storage local

---

## 🔄 CI/CD con Coolify

Coolify detectará cambios en el repo y desplegará automáticamente:

```
Git Push → Coolify Webhook → Build Docker Image → Deploy
```

**Configuración**:
1. En tu repositorio Git, configurar webhook
2. URL: `https://coolify.tu-servidor.com/webhooks/<token>`
3. Eventos: Push en rama `main`

---

## 🧪 Testing Post-Despliegue

### Checklist de Verificación

#### Backend
- [ ] `GET https://api.tu-dominio.com/api/` responde "Bienvenido a la API"
- [ ] Health check: Base de datos conectada
- [ ] Logs de backend sin errores
- [ ] Migraciones ejecutadas correctamente

#### Frontend
- [ ] Sitio carga en `https://tu-dominio.com`
- [ ] No errores en consola del navegador
- [ ] Autenticación con Clerk funciona
- [ ] API calls responden correctamente

#### Integraciones
- [ ] Clerk auth funciona
- [ ] Stripe payments (test con cantidad pequeña)
- [ ] PayPal payments
- [ ] Emails de Brevo se envían
- [ ] Google Meet links se generan
- [ ] Uploads de imágenes funcionan

#### Funcionalidad Crítica
- [ ] Usuario puede reservar cita
- [ ] Proceso de pago completo
- [ ] Confirmación por email
- [ ] Link de reunión se genera
- [ ] Panel de administración funciona

---

## 🐛 Solución de Problemas Comunes

### Problema: Backend no conecta a MySQL
**Solución**:
1. Verificar variables de entorno
2. Verificar que el contenedor MySQL esté corriendo
3. Revisar logs: `docker logs <mysql-container>`
4. Verificar red de Docker

### Problema: Frontend no llama al API
**Solución**:
1. Verificar `VITE_API_URL` en build
2. Revisar configuración de proxy de Nginx
3. Verificar CORS en backend

### Problema: Uploads de imágenes fallan
**Solución**:
1. Verificar que el volumen esté montado
2. Verificar permisos: `chmod 755 uploads/`
3. Revisar tamaño máximo en `express.json()`

### Problema: Migraciones no ejecutan
**Solución**:
1. Verificar conexión a DB
2. Ejecutar manualmente desde terminal
3. Revisar logs de Sequelize

### Problema: Webhooks no funcionan
**Solución**:
1. Verificar que la URL sea accesible públicamente
2. Revisar logs del backend para errores
3. Verificar secret keys correctas

---

## 📊 Monitoreo y Logs

### Ver Logs en Coolify
1. Ir a la aplicación
2. Pestaña "Logs"
3. Ver en tiempo real

### Logs del Backend
```bash
docker logs -f <backend-container-id>
```

### Logs del Frontend (Nginx)
```bash
docker logs -f <frontend-container-id>
```

### Logs de MySQL
```bash
docker logs -f <mysql-container-id>
```

---

## 🚀 Optimizaciones Recomendadas

### 1. Build de Frontend
Usar multi-stage build (ya configurado en Dockerfile)

### 2. Caching
- Configurar Redis para sesiones y cache
- Usar CDN para assets estáticos

### 3. Base de Datos
- Configurar connection pooling en Sequelize
- Agregar índices en tablas frecuentes

### 4. Scaling
- Frontend: Múltiples réplicas (Nginx + balanceo)
- Backend: Horizontal pod autoscaling
- MySQL: Replica set para lecturas

---

## 📝 Checklist Final Antes de Ir a Producción

- [ ] Código subido a repositorio Git
- [ ] Variables de entorno configuradas en Coolify
- [ ] Base de datos MySQL creada
- [ ] Volúmenes persistentes configurados
- [ ] Dominios configurados y DNS propagado
- [ ] HTTPS activo en ambos dominios
- [ ] Migraciones ejecutadas
- [ ] Webhooks configurados (Clerk, Stripe, PayPal)
- [ ] Seeds ejecutados (datos iniciales)
- [ ] Uploads funciona
- [ ] Emails se envían
- [ ] Pagos de prueba funcionan
- [ ] Backup automático configurado
- [ ] Monitoreo configurado

---

## 🎉 ¡Listo para Producción!

Una vez completados todos los pasos, tu aplicación estará funcionando en:
- **Frontend**: `https://tu-dominio.com`
- **Backend API**: `https://api.tu-dominio.com`

### Comandos Útiles

```bash
# Ver contenedores corriendo
docker ps

# Ver logs de backend
docker logs -f --tail 100 <backend-container>

# Reiniciar backend
docker restart <backend-container>

# Acceder a terminal del contenedor
docker exec -it <container-id> sh

# Ejecutar migraciones
docker exec -it <backend-container> npm run migration

# Backup de base de datos
docker exec <mysql-container> mysqldump -u user -p database > backup.sql
```

---

## 📞 Soporte

Para problemas específicos:
1. Revisar logs en Coolify
2. Verificar documentación de Coolify: https://coolify.io/docs
3. Revisar logs de Docker
4. Verificar configuración de servicios externos (Clerk, Stripe, etc.)
