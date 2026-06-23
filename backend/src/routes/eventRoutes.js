import express from 'express';
import {
    getEvents, getAllEventsAdmin, getEventById,
    createEvent, updateEvent, deleteEvent, getEventBarcodes,
} from '../controllers/eventController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getEvents)
    .post(protect, admin, createEvent);

router.get('/admin/all', protect, admin, getAllEventsAdmin);
router.get('/:id/barcodes', protect, admin, getEventBarcodes);

router.route('/:id')
    .get(getEventById)
    .put(protect, admin, updateEvent)
    .delete(protect, admin, deleteEvent);


    

export default router;