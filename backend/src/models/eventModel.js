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

        ticketImage: { type: String, default: '' },

        description: { type: String, required: true },

        category: {
            type: String,
            required: true,
            enum: [
                'Koncerti',
                'Festivali',
                'Sport',
                'Pozorište',
                'Komedija',
                'Ostalo',
            ],
            default: 'Ostalo',
        },

        venue: {
            name: { type: String, required: true },
            city: { type: String, required: true },
            country: String,
            address: String,
        },

        // 🔥 SAMO JEDAN DATETIME
        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        ticketTypes: [ticketTypeSchema],

        isActive: {
            type: Boolean,
            default: true,
        },

        hasSeatMap: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;