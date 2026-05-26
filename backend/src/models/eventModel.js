import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    availableQuantity: { type: Number, required: true },
});

const eventSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: { type: String, required: true },
        image: {
            type: String,
            required: true,
            default: '/images/placeholder.jpg',
        },
        description: { type: String, required: true },
        category: {
            type: String,
            required: true,
            enum: ['Koncerti', 'Festivali', 'Sport', 'Pozorište', 'Komedija', 'Ostalo'],
            default: 'Ostalo',
        },
        venue: {
            name: { type: String, required: true },
            city: { type: String, required: true },
            address: { type: String },
        },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        ticketTypes: [ticketTypeSchema],
        isActive: { type: Boolean, default: true },

        // Da li ovaj događaj koristi mapu sedišta
        hasSeatMap: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;