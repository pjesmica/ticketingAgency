import mongoose from 'mongoose';

const seatObjectSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['seat', 'stage', 'label', 'space', 'gazone'], required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    row: { type: String },
    seatNumber: { type: Number },
    sector: { type: String },
    ticketTypeId: { type: String },
    ticketTypeName: { type: String },
    price: { type: Number },
    capacity: { type: Number },
    label: { type: String },
    color: { type: String },
}, { _id: false });

const venueTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    canvasWidth: { type: Number, default: 900 },
    canvasHeight: { type: Number, default: 600 },
    objects: [seatObjectSchema],
    seatCount: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-count seats before save (async verzija — kompatibilna sa Mongoose 7+)
venueTemplateSchema.pre('save', async function () {
    const seatCount = this.objects.filter(o => o.type === 'seat').length;
    const gaCount = this.objects
        .filter(o => o.type === 'gazone')
        .reduce((sum, o) => sum + (o.capacity || 0), 0);
    this.seatCount = seatCount + gaCount;
});

const VenueTemplate = mongoose.model('VenueTemplate', venueTemplateSchema);
export default VenueTemplate;