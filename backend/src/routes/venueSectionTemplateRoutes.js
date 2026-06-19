import express from 'express';
import {
    getVenueSectionTemplates,
    getVenueSectionTemplateById,
    createVenueSectionTemplate,
    updateVenueSectionTemplate,
    deleteVenueSectionTemplate,
    applyVenueSectionTemplate,
} from '../controllers/venueSectionTemplateController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getVenueSectionTemplates)
    .post(protect, admin, createVenueSectionTemplate);

router.post('/apply/:eventId', protect, admin, applyVenueSectionTemplate);

router.route('/:id')
    .get(protect, admin, getVenueSectionTemplateById)
    .put(protect, admin, updateVenueSectionTemplate)
    .delete(protect, admin, deleteVenueSectionTemplate);

export default router;