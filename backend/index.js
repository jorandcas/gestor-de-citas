import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import logger from './utils/logger.js';
import db from './database/index.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import manualPaymentsRoutes from './routes/manualPaymentsAppointments.routes.js';
import currenciesRoutes from './routes/currencies.routes.js';
import usersRoutes from './routes/users.routes.js';
import configRoutes from './routes/config.routes.js';
import paymentsMethodsRoutes from './routes/paymentsMethods.routes.js';
import paymentStripeRoutes from './routes/paymentStripe.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import meettingsRoutes from './routes/mettings.routes.js';
import generateLinkRoutes from './routes/generateLink.routes.js';
import paymentPaypalRoutes from './routes/paymentPaypal.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';

// ✅ IMPORTANTE: Importamos tu nuevo gestor de Cron Jobs
import { startCronJobs } from './utils/cronJobs.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // MOVIDO ANTES DE LAS RUTAS

const API_PREFIX = process.env.API_PREFIX || '/api';

// Rutas
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentsRoutes);
app.use(`${API_PREFIX}/payments`, paymentsRoutes);
app.use(`${API_PREFIX}/manual-payments`, manualPaymentsRoutes);
app.use(`${API_PREFIX}/currencies`, currenciesRoutes);
app.use(`${API_PREFIX}/config`, configRoutes);
app.use(`${API_PREFIX}/payment-methods`, paymentsMethodsRoutes);
app.use(`${API_PREFIX}/payment-stripe`, paymentStripeRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/meetings`, meettingsRoutes);
app.use(`${API_PREFIX}/generate-link`, generateLinkRoutes);
app.use(`${API_PREFIX}/payment-paypal`, paymentPaypalRoutes);
app.use(`${API_PREFIX}/webhooks`, webhooksRoutes);
app.use(`${API_PREFIX}/uploads`, express.static('uploads'));

// Endpoint de verificación
app.get(`${API_PREFIX}/`, (req, res) => {
  res.json({ message: 'Bienvenido a la API' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

db.sequelize.authenticate().then(() => {
  db.initialize();
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`);

    // ✅ AQUÍ ACTIVAMOS LOS CRON JOBS (Citas completadas + Correos abandono)
    startCronJobs();
  });
}).catch(err => {
  logger.error('Database connection error:', err);
});