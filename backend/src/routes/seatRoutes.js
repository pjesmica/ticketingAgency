import express from 'express';
import { getSeatsForEvent, generateSeats } from '../controllers/seatController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dobavi sedišta za događaj (public)
router.get('/:eventId', getSeatsForEvent);

// Admin: generiši sedišta za događaj
router.post('/generate/:eventId', protect, admin, generateSeats);

export default router;