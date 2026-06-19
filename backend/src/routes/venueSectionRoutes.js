import express from 'express';
import { saveVenueLayout, getVenueLayout } from '../controllers/venueSectionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:eventId',  getVenueLayout);
router.post('/:eventId', protect, admin, saveVenueLayout);

export default router;