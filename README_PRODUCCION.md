# 🚀 Guía Rápida de Despliegue en Producción

## ⚡ Resumen Rápido

Esta guía te ayudará a desplegar el **Gestor de Citas** en producción usando **Hetzner + Coolify**.

## 📋 Pre-requisitos

✅ Servidor en Hetzner (mínimo 4GB RAM, 2 CPU)
✅ Dominio propio apuntando a la IP del servidor
✅ Coolify instalado en el servidor
✅ Cuentas en servicios externos:
  - [Clerk](https://clerk.com) (Autenticación)
  - [Stripe](https://stripe.com) (Pagos con tarjeta)
  - [PayPal](https://developer.paypal.com) (Pagos PayPal)
  - [Brevo/SendinBlue](https://brevo.com) (Emails)
  - [Google Cloud](https://console.cloud.google.com) (Google Meet)

## 🎯 Arquitectura de Producción

```
┌──────────────────────────────────────────┐
│             tu-dominio.com               │  ← Frontend (React + Nginx)
│          (Coolify + Traefik)             │
├──────────────────────────────────────────┤
│           api.tu-dominio.com             │  ← Backend (Node.js + Express)
│          (Coolify + Traefik)             │
├──────────────────────────────────────────┤
│              MySQL Database              │  ← Base de datos (Coolify managed)
└──────────────────────────────────────────┘
```

## 📝 Pasos del Despliegue

### 1. Preparar el Repositorio

```bash
# Subir tu código a GitHub/GitLab
git init
git add .
git commit -m "Ready for production"
git remote add origin <TU_REPOSITORIO_URL>
git push -u origin main
```

### 2. Configurar Base de Datos en Coolify

1. En Coolify, crear un nuevo recurso tipo **Database**
2. Seleccionar **MySQL 8.0**
3. Asignar nombre: `gestor-citas-db`
4. Coolify generará automáticamente las credenciales

### 3. Desplegar Backend

1. Crear nueva aplicación en Coolify:
   - **Repository**: Tu repo de Git
   - **Branch**: `main`
   - **Dockerfile path**: `backend/Dockerfile`
   - **Port**: `3000`

2. Configurar **Persistent Volume**:
   - Montar en: `/app/uploads`
   - Nombre: `backend-uploads`

3. Configurar **Environment Variables** (usar `backend/.env.production.example` como referencia):
   ```bash
   NODE_ENV=production
   PORT=3000
   API_PREFIX=/api
   DB_HOST=<GENERADO_POR_COOLIFY>
   DB_PORT=3306
   DB_NAME=<GENERADO_POR_COOLIFY>
   DB_USER=<GENERADO_POR_COOLIFY>
   DB_PASSWORD=<GENERADO_POR_COOLIFY>
   URL_BACKEND=https://api.tu-dominio.com
   URL_FRONTEND=https://tu-dominio.com
   FRONTEND_URL=https://tu-dominio.com
   CLERK_SECRET_KEY=<TU_CLAVE_CLERK>
   CLERK_WEBHOOK_SECRET=<TU_WEBHOOK_SECRET>
   # ... resto de variables (ver .env.production.example)
   ```

4. **Domain Settings**:
   - Agregar dominio: `api.tu-dominio.com`
   - Coolify configurará HTTPS automáticamente

5. **Ejecutar Migraciones**:
   - Abrir terminal web en Coolify
   - Ejecutar: `npm run migration`

### 4. Desplegar Frontend

1. Crear nueva aplicación en Coolify:
   - **Repository**: Tu repo de Git
   - **Branch**: `main`
   - **Dockerfile path**: `frontend/Dockerfile`
   - **Port**: `80`

2. Configurar **Environment Variables**:
   ```bash
   VITE_API_URL=https://api.tu-dominio.com
   ```

3. **Domain Settings**:
   - Agregar dominio: `tu-dominio.com`
   - Coolify configurará HTTPS automáticamente

### 5. Configurar Webhooks Externos

#### Clerk Webhook
1. Ir a [Clerk Dashboard](https://dashboard.clerk.com) → Settings → Webhooks
2. Agregar endpoint: `https://api.tu-dominio.com/api/webhooks/clerk`
3. Seleccionar eventos: `user.created`, `user.updated`, `user.deleted`
4. Copiar el **Signing Secret** y agregarlo a `CLERK_WEBHOOK_SECRET`

#### Stripe Webhook (opcional)
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://api.tu-dominio.com/api/webhooks/stripe`
3. Eventos: `payment_intent.succeeded`, `payment_intent.failed`
4. Copiar secreto y agregar al backend

#### PayPal Webhook (opcional)
1. PayPal Developer → Webhooks
2. URL: `https://api.tu-dominio.com/api/webhooks/paypal`

### 6. Verificar Despliegue

```bash
# Verificar backend
curl https://api.tu-dominio.com/api/
# Debe responder: {"message":"Bienvenido a la API"}

# Verificar frontend
# Abrir en navegador: https://tu-dominio.com
```

## ✅ Checklist Pre-Producción

- [ ] Todas las variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas
- [ ] Dominios configurados y DNS propagado
- [ ] HTTPS funcionando en ambos dominios
- [ ] Webhooks configurados (Clerk, Stripe, PayPal)
- [ ] Volumen persistente para uploads configurado
- [ ] Emails de prueba enviados (Brevo)
- [ ] Pagos de prueba funcionando (Stripe/PayPal)
- [ ] Google Meet links se generan correctamente

## 🔧 Solución de Problemas

### Backend no inicia
```bash
# Ver logs en Coolify o ejecutar:
docker logs -f <backend-container-id>
```

### Error de conexión a MySQL
- Verificar que el contenedor MySQL esté corriendo
- Verificar variables de entorno de DB
- Revisar red de Docker

### Frontend no llama al API
- Verificar `VITE_API_URL` en el build
- Reconstruir frontend después de cambiar variables
- Verificar CORS en backend

### Uploads fallan
- Verificar que el volumen esté montado: `/app/uploads`
- Verificar permisos de escritura

## 📚 Documentación Adicional

- **Plan completo**: Ver `PLAN_DESPLIEGUE_PRODUCCION.md`
- **Variables de entorno**: Ver `backend/.env.production.example`
- **Docker Compose local**: Ver `docker-compose.yml`

## 🆘 Soporte

Para problemas específicos:
1. Revisar logs en Coolify
2. [Documentación de Coolify](https://coolify.io/docs)
3. [Documentación de Clerk](https://clerk.com/docs)
4. [Documentación de Stripe](https://stripe.com/docs)

## 🎉 ¡Éxito!

Tu aplicación debería estar funcionando en:
- **Frontend**: `https://tu-dominio.com`
- **Backend API**: `https://api.tu-dominio.com`

---

## 📊 Monitoreo

### Ver Logs
```bash
# Backend
docker logs -f --tail 100 <backend-container>

# Frontend (Nginx)
docker logs -f <frontend-container>

# MySQL
docker logs -f <mysql-container>
```

### Backup de Base de Datos
Configurar en Coolify:
- Destino: S3 o storage local
- Frecuencia: Diaria
- Retención: 7 días

---

**Última actualización**: 2025-02-04
**Versión**: 1.0.0
