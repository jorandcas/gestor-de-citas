# 🚀 Optimizaciones para Producción

Esta guía contiene optimizaciones recomendadas para mejorar el rendimiento, seguridad y escalabilidad de tu aplicación en producción.

---

## 🎯 Optimizaciones Críticas (Implementar Primero)

### 1. Configurar CORS Correctamente

**Problema**: Actualmente el backend tiene `origin: '*'` que permite cualquier origen.

**Solución**: Modificar `backend/index.js`:

```javascript
// ❌ ANTES (inseguro)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ DESPUÉS (seguro)
const allowedOrigins = [
  process.env.FRONTEND_URL,      // https://tu-dominio.com
  'https://www.tu-dominio.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 horas
}));
```

---

### 2. Configurar Rate Limiting

**Problema**: Sin rate limiting, tu API es vulnerable a ataques DDoS y abuso.

**Solución**: Instalar y configurar `express-rate-limit`:

```bash
npm install express-rate-limit
```

Agregar en `backend/index.js`:

```javascript
import rateLimit from 'express-rate-limit';

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de autenticación
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/', limiter);
app.use('/api/payments', authLimiter); // Endpoint de pagos más estricto
```

---

### 3. Configurar Compression

**Problema**: Respuestas JSON sin compresión usan más ancho de banda.

**Solución**: Agregar compresión gzip:

```bash
npm install compression
```

En `backend/index.js`:

```javascript
import compression from 'compression';

app.use(compression());
```

---

### 4. Optimizar Sequelize

**Problema**: Configuración por defecto de Sequelize no es óptima para producción.

**Solución**: Crear `backend/database/config/sequelize-config.js`:

```javascript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      bigNumberStrings: true,
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
    },
    pool: {
      max: 20, // Máximo de conexiones en el pool
      min: 5,  // Mínimo de conexiones en el pool
      acquire: 30000, // Máximo tiempo (ms) para obtener conexión
      idle: 10000, // Tiempo (ms) que una conexión puede estar inactiva
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
  }
);

export default sequelize;
```

---

## 🔒 Optimizaciones de Seguridad

### 5. Configurar Helmet Adicional

Mejorar configuración de Helmet en `backend/index.js`:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
}));
```

---

### 6. Sanitizar Input

Instalar y configurar validación adicional:

```bash
npm install express-mongo-sanitize express-validator
```

```javascript
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';

// Sanitizar input
app.use(mongoSanitize());

// Middleware de validación
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Usar en rutas
app.post('/api/appointments',
  [
    body('email').isEmail().normalizeEmail(),
    body('date').isISO8601().toDate(),
    body('price').isFloat({ min: 0 }),
  ],
  validateRequest,
  createAppointment
);
```

---

### 7. Configurar HTTPS Redirection

Asegurar que todas las requests usen HTTPS:

```javascript
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

---

## ⚡ Optimizaciones de Rendimiento

### 8. Implementar Caching con Redis

**Problema**: Consultas repetidas a la base de datos son lentas.

**Solución**: Implementar Redis para cache:

```bash
npm install redis
```

Crear `backend/utils/cache.js`:

```javascript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));

await client.connect();

export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Sobrescribir res.json para cachear la respuesta
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        client.setEx(key, duration, JSON.stringify(data)).catch(() => {});
        return originalJson(data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

export default client;
```

Usar en rutas que no cambian frecuentemente:

```javascript
import { cacheMiddleware } from '../utils/cache.js';

// Cachear por 5 minutos
app.get('/api/currencies', cacheMiddleware(300), getCurrencies);
app.get('/api/config', cacheMiddleware(600), getConfig);
```

**Configurar en Coolify**:
- Agregar servicio Redis
- Variable: `REDIS_URL=redis://redis:6379`

---

### 9. Implementar Database Indexing

Agregar índices en tablas frecuentemente consultadas:

```javascript
// En tus migraciones o modelos
await queryInterface.addIndex('appointments', ['status', 'date']);
await queryInterface.addIndex('appointments', ['userId']);
await queryInterface.addIndex('payments_appointments', ['status']);
await queryInterface.addIndex('payments_appointments', ['appointmentId']);
```

---

### 10. Optimizar Frontend Build

Mejorar `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Deshabilitar sourcemaps en producción
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          clerk: ['@clerk/clerk-react'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/uploads': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
    },
  },
});
```

---

### 11. Implementar Lazy Loading en Frontend

Usar React.lazy para cargar componentes bajo demanda:

```typescript
import { lazy, Suspense } from 'react';
import { Loader } from './components/ui/loader';

const DashboardUser = lazy(() => import('./pages/DashboardUser'));
const Reservation = lazy(() => import('./pages/Reservation'));
const Settings = lazy(() => import('./pages/Settings'));

// En tu router
<Suspense fallback={<Loader />}>
  <Route path="/dashboard" element={<DashboardUser />} />
  <Route path="/reserve" element={<Reservation />} />
  <Route path="/settings" element={<Settings />} />
</Suspense>
```

---

## 📊 Optimizaciones de Monitoreo

### 12. Implementar Health Check Endpoint

Agregar endpoint detallado de health check:

```javascript
app.get('/api/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    checks: {
      database: 'unknown',
      redis: 'unknown',
    }
  };

  try {
    await db.sequelize.authenticate();
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    if (redisClient) {
      await redisClient.ping();
      health.checks.redis = 'healthy';
    }
  } catch (error) {
    health.checks.redis = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

### 13. Implementar Logging Estructurado

Ya usas Winston, pero aseguremos que esté configurado para producción:

```javascript
// backend/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'gestor-citas' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

---

## 🔧 Optimizaciones de Escalabilidad

### 14. Configurar Horizontal Scaling

Para escalar el backend, modificar `backend/index.js`:

```javascript
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Reemplazar worker
  });
} else {
  // Código de tu servidor aquí
  const app = express();
  // ... resto del código
}
```

---

### 15. Implementar Queue para Jobs Pesados

Para tareas como enviar emails o procesar webhooks:

```bash
npm install bull
```

```javascript
// backend/utils/queue.js
import Bull from 'bull';

const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
  },
});

export const addEmailJob = (data) => {
  return emailQueue.add(data);
};

emailQueue.process(async (job) => {
  // Enviar email aquí
  await sendEmail(job.data);
  return { success: true };
});
```

---

## 📦 Checklist de Optimizaciones

### Prioridad ALTA
- [ ] Configurar CORS correctamente
- [ ] Implementar rate limiting
- [ ] Configurar compresión
- [ ] Optimizar pool de Sequelize
- [ ] Configurar Helmet completo

### Prioridad MEDIA
- [ ] Implementar sanitización de input
- [ ] Agregar índices en base de datos
- [ ] Implementar health check detallado
- [ ] Optimizar build de Vite
- [ ] Implementar lazy loading

### Prioridad BAJA (opcional)
- [ ] Implementar Redis cache
- [ ] Implementar queue para jobs
- [ ] Configurar cluster mode
- [ ] Implementar tracing distribuido

---

## 🔗 Recursos Adicionales

- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Sequelize Optimization](https://sequelize.org/docs/v6/other-topics/performance-optimization/)
- [Coolify Documentation](https://coolify.io/docs)

---

**Última actualización**: 2025-02-04
