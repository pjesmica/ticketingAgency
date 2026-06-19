import express from 'express';
import {
    getVenueTemplates,
    getVenueTemplateById,
    createVenueTemplate,
    updateVenueTemplate,
    deleteVenueTemplate,
    applyVenueTemplate,
} from '../controllers/venueTemplateController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lista svih šablona + kreiranje novog
router.route('/')
    .get(protect, admin, getVenueTemplates)
    .post(protect, admin, createVenueTemplate);

// Primeni šablon na dogadjaj
router.post('/apply/:eventId', protect, admin, applyVenueTemplate);

// Jedan šablon
router.route('/:id')
    .get(protect, admin, getVenueTemplateById)
    .put(protect, admin, updateVenueTemplate)
    .delete(protect, admin, deleteVenueTemplate);

export default router;