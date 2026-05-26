import mongoose from 'mongoose';

// Jedno sedište u dvorani
const seatSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event',
    },
    ticketType: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    ticketTypeName: {
        type: String,
        required: true,
    },
    row: {
        type: String,   // npr. "A", "B", "VIP1"
        required: true,
    },
    seatNumber: {
        type: Number,   // npr. 1, 2, 3...
        required: true,
    },
    sector: {
        type: String,   // npr. "Parter", "VIP", "Balkon"
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    isReserved: {
        type: Boolean,
        default: false,
    },
    reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
    },
});

// Jedinstven indeks — ne mogu dva sedišta istog reda i broja za isti događaj
seatSchema.index({ event: 1, row: 1, seatNumber: 1 }, { unique: true });

const Seat = mongoose.model('Seat', seatSchema);

export default Seat;