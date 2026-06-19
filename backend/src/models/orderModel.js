import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event',
    },
    eventName: { type: String, required: true },
    eventDate: { type: Date, required: true },
    eventVenue: { type: String, default: '' },
    ticketType: { type: String, required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },

    // Referenca na konkretna sedišta
    seats: [
        {
            seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
            row: { type: String },
            seatNumber: { type: Number },
            sector: { type: String },
        },
    ],
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [orderItemSchema],
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        paymentMethod: {
            type: String,
            required: true,
            default: 'PayPal',
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;