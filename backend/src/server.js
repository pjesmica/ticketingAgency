import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import expireUnpaidOrders from './utils/expireOrders.js';

import eventRoutes from './routes/eventRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import venueLayoutRoutes from './routes/venueLayoutRoutes.js';
import venueTemplateRoutes from './routes/venueTemplateRoutes.js';
import venueSectionRoutes from './routes/venueSectionRoutes.js';
import venueSectionTemplateRoutes from './routes/venueSectionTemplateRoutes.js';

// DB
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ROUTES
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/venue-layout', venueLayoutRoutes);
app.use('/api/venue-templates', venueTemplateRoutes);
app.use('/api/venue-sections', venueSectionRoutes);
app.use('/api/venue-section-templates', venueSectionTemplateRoutes);

// 🔥 TEST EMAIL ROUTE (OVO JE BITNO)
app.get('/test-email', async (req, res) => {
  try {
    const { default: resend } = await import('./config/emailConfig.js');

    const result = await resend.emails.send({
      from: 'Ticket App <onboarding@resend.dev>',
      to: 'TVOJ_EMAIL@gmail.com', // 👈 PROMIJENI OVO
      subject: 'Test Email',
      html: '<h1>Resend radi 🎉</h1><p>Email sistem je aktivan.</p>',
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PayPal config
app.get('/api/config/paypal', (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID || 'sb' });
});

// ERROR HANDLERS (MORA NA KRAJU)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Proveri istekle narudžbine odmah pri startu,
  // pa zatim na svakih 30 minuta
  expireUnpaidOrders();
  setInterval(expireUnpaidOrders, 30 * 60 * 1000);
});