import mongoose from 'mongoose';

const seatObjectSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['seat', 'stage', 'label', 'space', 'gazone'], required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    // seat-specific
    row: { type: String },
    seatNumber: { type: Number },
    sector: { type: String },
    ticketTypeId: { type: String },
    ticketTypeName: { type: String },
    price: { type: Number },
    // GA zone-specific
    capacity: { type: Number },
    // label/stage
    label: { type: String },
    color: { type: String },
}, { _id: false });

const venueLayoutSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        unique: true,
    },
    canvasWidth: { type: Number, default: 900 },
    canvasHeight: { type: Number, default: 600 },
    objects: [seatObjectSchema],
}, { timestamps: true });

const VenueLayout = mongoose.model('VenueLayout', venueLayoutSchema);

export default VenueLayout;