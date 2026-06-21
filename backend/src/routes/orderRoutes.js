import express from 'express';
import {
    createOrder, getOrderById, updateOrderToPaid, confirmFreeOrder,
    getMyOrders, getOrders, getOrderTicketPdf,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, admin, getOrders);
router.get('/myorders', protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/free').put(protect, confirmFreeOrder);
router.get('/:id/tickets/:itemIndex/:qtyIndex/pdf', protect, getOrderTicketPdf);

export default router;