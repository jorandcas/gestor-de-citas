# 🚀 Inicio Rápido - Despliegue en Producción

## ⏱️ Tiempo estimado: 2-3 horas

Este es un resumen ejecutivo para desplegar tu aplicación **Gestor de Citas** en **Hetzner + Coolify**.

---

## 📋 Arquitectura Final

```
┌────────────────────────────────────────────────────────────┐
│                      tu-dominio.com                        │
│                  (React Frontend - Nginx)                  │
│                      Puerto: 80 / 443                      │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   api.tu-dominio.com                       │
│              (Node.js Backend - Express)                   │
│                     Puerto: 3000                           │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Volúmenes Persistentes                               │ │
│  │  📁 /app/uploads (imágenes de pagos)                 │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│              MySQL Database (Coolify managed)              │
│                    Puerto: 3306                            │
│              Backup automático diario                      │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Proceso de Despliegue (6 Pasos)

### Paso 1: Preparar Repositorio (10 min)

```bash
# 1. Verificar que todo esté listo
node check-production-ready.js

# 2. Subir a GitHub/GitLab
git add .
git commit -m "Ready for production"
git remote add origin <TU_REPO_URL>
git push -u origin main
```

### Paso 2: Configurar MySQL en Coolify (5 min)

1. Panel de Coolify → New Resource → Database
2. Seleccionar **MySQL 8.0**
3. Nombre: `gestor-citas-db`
4. Coolify genera automáticamente credenciales ✅

### Paso 3: Desplegar Backend (45 min)

1. **Crear Aplicación**:
   - New Resource → Application
   - Repositorio: Tu repo de Git
   - Rama: `main`
   - Dockerfile: `backend/Dockerfile`
   - Puerto: `3000`

2. **Configurar Volumen Persistente**:
   - Volumen: `backend-uploads`
   - Montar en: `/app/uploads`

3. **Variables de Entorno** (copiar desde `backend/.env.production.example`):
   ```
   NODE_ENV=production
   DB_HOST=<COOLIFY_DB_HOST>
   DB_NAME=<COOLIFY_DB_NAME>
   DB_USER=<COOLIFY_DB_USER>
   DB_PASSWORD=<COOLIFY_DB_PASSWORD>
   URL_BACKEND=https://api.tu-dominio.com
   URL_FRONTEND=https://tu-dominio.com
   FRONTEND_URL=https://tu-dominio.com
   CLERK_SECRET_KEY=sk_live_xxx
   CLERK_WEBHOOK_SECRET=whsec_xxx
   ADMIN_EMAIL=tu@email.com
   # ... resto de variables
   ```

4. **Dominio**:
   - Agregar: `api.tu-dominio.com`
   - Coolify configura HTTPS automático

5. **Ejecutar Migraciones**:
   - Terminal web en Coolify
   - Comando: `npm run migration`

### Paso 4: Desplegar Frontend (30 min)

1. **Crear Aplicación**:
   - New Resource → Application
   - Repositorio: Tu repo de Git
   - Rama: `main`
   - Dockerfile: `frontend/Dockerfile`
   - Puerto: `80`

2. **Variables de Entorno**:
   ```
   VITE_API_URL=https://api.tu-dominio.com
   ```

3. **Dominio**:
   - Agregar: `tu-dominio.com`
   - Coolify configura HTTPS automático

### Paso 5: Configurar Webhooks (30 min)

| Servicio | Endpoint URL | Documentación |
|----------|--------------|---------------|
| **Clerk** | `https://api.tu-dominio.com/api/webhooks/clerk` | [Clerk Webhooks](https://clerk.com/docs/webhooks/sync) |
| **Stripe** | `https://api.tu-dominio.com/api/webhooks/stripe` | [Stripe Webhooks](https://stripe.com/docs/webhooks) |
| **PayPal** | `https://api.tu-dominio.com/api/webhooks/paypal` | [PayPal Webhooks](https://developer.paypal.com/docs/api-basics/webhooks/) |

### Paso 6: Testing (30 min)

```bash
# 1. Verificar backend
curl https://api.tu-dominio.com/api/
# Respuesta esperada: {"message":"Bienvenido a la API"}

# 2. Verificar frontend
# Abrir https://tu-dominio.com en navegador

# 3. Probar flujo completo:
#    - Registro/login
#    - Reservar cita
#    - Proceso de pago
#    - Recepción de email
#    - Generación de link de reunión
```

---

## ✅ Variables de Entorno Críticas

### Backend (Requeridas)

```bash
# Base de datos
DB_HOST=<COOLIFY_GENERADO>
DB_NAME=<COOLIFY_GENERADO>
DB_USER=<COOLIFY_GENERADO>
DB_PASSWORD=<COOLIFY_GENERADO>

# URLs
URL_BACKEND=https://api.tu-dominio.com
URL_FRONTEND=https://tu-dominio.com
FRONTEND_URL=https://tu-dominio.com

# Autenticación
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
ADMIN_EMAIL=tu@email.com

# Pagos
PAYPAL_CLIENT_ID=Axjxxx
PAYPAL_CLIENT_SECRET=EJxxx
PAYPAL_BASE_URL=https://api-m.paypal.com
STRIPE_SECRET_KEY=sk_live_xxx

# Email
BREVO_API_KEY=xkeysib-xxx
BREVO_SENDER_EMAIL=noreply@tu-dominio.com
```

### Frontend (Requeridas)

```bash
VITE_API_URL=https://api.tu-dominio.com
```

---

## 🚨 Problemas Comunes y Soluciones

| Problema | Solución |
|----------|----------|
| **Backend no conecta a MySQL** | Verificar `DB_HOST` en variables de entorno |
| **Frontend no llama al API** | Reconstruir frontend después de cambiar `VITE_API_URL` |
| **Uploads fallan** | Verificar volumen `/app/uploads` esté montado |
| **Webhooks no funcionan** | Verificar URL sea pública y accesible |
| **CORS errors** | Configurar `FRONTEND_URL` correctamente |
| **Migraciones no ejecutan** | Ejecutar manualmente desde terminal |
| **Emails no llegan** | Verificar `BREVO_API_KEY` y templates IDs |

---

## 📊 Archivos Creados para el Despliegue

```
Gestor de Citas/
├── 📄 PLAN_DESPLIEGUE_PRODUCCION.md     # Plan completo detallado
├── 📄 README_PRODUCCION.md               # Guía rápida
├── 📄 OPTIMIZACIONES_PRODUCCION.md      # Optimizaciones post-despliegue
├── 📄 docker-compose.yml                 # Para desarrollo local
├── 📄 check-production-ready.js          # Script de verificación
├── 📄 backend/
│   ├── .env.production.example          # Plantilla de variables
│   └── scripts/migrate.js                # Script de migraciones
└── 📄 frontend/
    ├── .env.production.example          # Plantilla de variables
    ├── Dockerfile                        # Producción (Nginx)
    └── Dockerfile.dev                    # Desarrollo (Vite)
```

---

## 🎓 Recursos de Aprendizaje

- **Coolify Docs**: https://coolify.io/docs
- **Clerk Docs**: https://clerk.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Hetzner Cloud**: https://docs.hetzner.com

---

## 📞 Soporte Rápido

### Comandos Útiles

```bash
# Ver logs del backend
docker logs -f <backend-container-id>

# Verificar contenedores corriendo
docker ps

# Ejecutar migraciones manualmente
docker exec -it <backend-container> npm run migration

# Acceder a terminal del contenedor
docker exec -it <container-id> sh

# Verificar espacio en disco
df -h
```

### Links Directos de Configuración

- [ ] [Crear cuenta Clerk](https://clerk.com/)
- [ ] [Crear cuenta Stripe](https://stripe.com/)
- [ ] [Crear cuenta PayPal Developer](https://developer.paypal.com/)
- [ ] [Crear cuenta Brevo](https://brevo.com/)
- [ ] [Crear proyecto Google Cloud](https://console.cloud.google.com/)

---

## 🎉 Checklist Final

Antes de declarar "producción lista":

**Configuración** ✅
- [ ] Dominios configurados y DNS propagado
- [ ] HTTPS funcionando en ambos dominios
- [ ] MySQL corriendo y accesible
- [ ] Volumen persistente montado
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] Seeds ejecutados (datos iniciales)

**Integraciones** ✅
- [ ] Clerk webhook configurado
- [ ] Stripe configurado (producción)
- [ ] PayPal configurado (producción)
- [ ] Brevo emails funcionando
- [ ] Google Meet OAuth configurado

**Testing** ✅
- [ ] Registro/login funciona
- [ ] Reserva de cita funciona
- [ ] Pagos funcionan
- [ ] Emails se envían
- [ ] Links de reunión se generan
- [ ] Uploads de imágenes funcionan

**Monitoreo** ✅
- [ ] Logs accesibles
- [ ] Health check `/api/health` funciona
- [ ] Backup automático configurado
- [ ] Alertas configuradas

---

## 🚀 ¡Listo para Lanzar!

Una vez completado, tu aplicación estará en:
- **Frontend**: `https://tu-dominio.com`
- **Backend API**: `https://api.tu-dominio.com`

**Tiempo estimado total**: 2-3 horas
**Costo mensual estimado** (Hetzner + Coolify):
- Servidor CX22: ~€4-6/mes
- MySQL: Incluido
- Total: **~€5-10/mes**

---

**¿Necesitas ayuda?** Revisa:
1. `PLAN_DESPLIEGUE_PRODUCCION.md` - Plan completo
2. `README_PRODUCCION.md` - Guía detallada
3. `OPTIMIZACIONES_PRODUCCION.md` - Post-despliegue

**Fecha de creación**: 2025-02-04
**Versión**: 1.0.0
