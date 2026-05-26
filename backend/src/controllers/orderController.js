import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';
import Event from '../models/eventModel.js';
import { reserveSeats } from './seatController.js';

// @desc    Kreiraj novu narudžbinu (kupi karte)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const { orderItems, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('Nema stavki u narudžbini');
    }

    // Provjeri dostupnost karata i smanji zalihe
    for (const item of orderItems) {
        const event = await Event.findById(item.eventId);
        if (!event) {
            res.status(404);
            throw new Error(`Događaj nije pronađen: ${item.eventId}`);
        }
        const ticketType = event.ticketTypes.id(item.ticketTypeId);
        if (!ticketType) {
            res.status(404);
            throw new Error('Tip karte nije pronađen');
        }
        if (ticketType.availableQuantity < item.quantity) {
            res.status(400);
            throw new Error(`Nema dovoljno karata za: ${event.name} (${ticketType.name})`);
        }
        ticketType.availableQuantity -= item.quantity;
        await event.save();
    }

    const totalPrice = orderItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    const order = new Order({
        user: req.user._id,
        orderItems,
        paymentMethod: paymentMethod || 'PayPal',
        totalPrice,
    });

    const createdOrder = await order.save();

    // Rezerviši konkretna sedišta ako su prosleđena
    for (const item of orderItems) {
        if (item.seats && item.seats.length > 0) {
            const seatIds = item.seats.map((s) => s.seatId);
            try {
                await reserveSeats(item.eventId, seatIds, req.user._id, createdOrder._id);
            } catch (err) {
                // Ako rezervacija padne, obriši narudžbinu
                await Order.findByIdAndDelete(createdOrder._id);
                res.status(400);
                throw new Error(err.message);
            }
        }
    }

    res.status(201).json(createdOrder);
});

// @desc    Dobavi narudžbinu po ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
        if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            res.status(401);
            throw new Error('Nije autorizovano');
        }
        res.status(200).json(order);
    } else {
        res.status(404);
        throw new Error('Narudžbina nije pronađena');
    }
});

// @desc    Ažuriraj narudžbinu na plaćeno
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer?.email_address,
        };
        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Narudžbina nije pronađena');
    }
});

// @desc    Dobavi narudžbine prijavljenog korisnika
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
});

// @desc    Dobavi sve narudžbine (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.status(200).json(orders);
});

export { createOrder, getOrderById, updateOrderToPaid, getMyOrders, getOrders };