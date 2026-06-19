import express from 'express';
import { getVenueLayout, saveVenueLayout } from '../controllers/venueLayoutController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:eventId', protect, admin, getVenueLayout);
router.post('/:eventId', protect, admin, saveVenueLayout);

export default router;