import express from 'express';
import crypto from 'crypto';
import db from '../database/index.js';
import { TZDate } from "@date-fns/tz";
import logger from '../utils/logger.js';

const router = express.Router();

router.use(express.json());

const ZONE = process.env.ZONE_TIME || "America/Mexico_City";
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Webhook de Clerk - Crear usuario cuando se registra
router.post('/clerk', async (req, res) => {
  try {
    // Verificar la firma del webhook (seguridad)
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    // En desarrollo, si hay secret pero la verificación falla, solo advertir
    if (CLERK_WEBHOOK_SECRET && svixId && svixTimestamp && svixSignature) {
      try {
        // Crear la firma esperada
        const signatureString = `${svixId}.${svixTimestamp}.${JSON.stringify(req.body)}`;
        const keyBuffer = Buffer.from(CLERK_WEBHOOK_SECRET.split('_')[1] || CLERK_WEBHOOK_SECRET, 'utf8');

        const hmac = crypto.createHmac('sha256', keyBuffer);
        hmac.update(signatureString);
        const expectedSignature = hmac.digest('base64');

        // Comparar firmas
        if (svixSignature !== expectedSignature) {
          console.warn('⚠️ Firma del webhook inválida (continuando en modo desarrollo)');
        }
      } catch (error) {
        console.warn('⚠️ Error verificando firma (continuando en modo desarrollo):', error.message);
      }
    } else if (!CLERK_WEBHOOK_SECRET) {
      console.log('ℹ️ CLERK_WEBHOOK_SECRET no configurado. Modo desarrollo sin verificación.');
    }

    const { data, type } = req.body;

    console.log('📨 Webhook de Clerk recibido:', type);

    // Manejar evento de usuario creado
    if (type === 'user.created') {
      const clerkId = data.id;
      const emailAddress = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Usuario';

      console.log(`✅ Nuevo usuario Clerk: ${clerkId} - ${emailAddress}`);

      // Verificar si el usuario ya existe
      const existingUser = await db.User.findOne({
        where: { cleark_id: clerkId }
      });

      if (existingUser) {
        console.log('⚠️ Usuario ya existe en BD, omitiendo creación');
        return res.status(200).json({ message: 'User already exists' });
      }

      // Crear usuario en la base de datos local
      const newUser = await db.User.create({
        cleark_id: clerkId,
        name: fullName,
        email: emailAddress,
        role: 'user', // Rol por defecto
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Usuario creado en BD local:', newUser.id);
      logger.info(`Usuario creado vía webhook Clerk: ${clerkId} - ${emailAddress}`);

      return res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        user: newUser
      });
    }

    // Manejar evento de usuario actualizado
    if (type === 'user.updated') {
      const clerkId = data.id;
      const emailAddress = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Usuario';

      console.log(`🔄 Actualizando usuario Clerk: ${clerkId}`);

      const user = await db.User.findOne({
        where: { cleark_id: clerkId }
      });

      if (user) {
        await user.update({
          name: fullName,
          email: emailAddress,
          updatedAt: new Date(),
        });
        console.log('✅ Usuario actualizado en BD local');
        logger.info(`Usuario actualizado vía webhook Clerk: ${clerkId}`);
      }

      return res.status(200).json({ message: 'User updated' });
    }

    // Manejar evento de usuario eliminado
    if (type === 'user.deleted') {
      const clerkId = data.id;

      console.log(`🗑️ Usuario eliminado en Clerk: ${clerkId}`);

      const user = await db.User.findOne({
        where: { cleark_id: clerkId }
      });

      if (user) {
        await user.destroy();
        console.log('✅ Usuario eliminado de BD local');
        logger.info(`Usuario eliminado vía webhook Clerk: ${clerkId}`);
      }

      return res.status(200).json({ message: 'User deleted' });
    }

    // Respuesta para otros eventos
    return res.status(200).json({ message: 'Event received but not processed' });

  } catch (error) {
    console.error('❌ Error procesando webhook de Clerk:', error);
    logger.error('Error en webhook Clerk:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

export default router;
