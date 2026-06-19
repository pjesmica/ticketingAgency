import mongoose from 'mongoose';

// Vizuelni dekorativni elementi na mapi sale (bina, tekst, prostor)
// Nemaju sedišta — samo su za prikaz
const venueDecorationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event',
    },
    type:   { type: String, enum: ['stage', 'label', 'entrance', 'space'], required: true },
    x:      { type: Number, required: true },
    y:      { type: Number, required: true },
    width:  { type: Number, default: 120 },
    height: { type: Number, default: 40 },
    label:  { type: String, default: '' },
    color:  { type: String, default: '#1f2937' },
    angle:  { type: Number, default: 0 },
    fontSize: { type: Number, default: 14 },
}, { timestamps: true });

const VenueDecoration = mongoose.model('VenueDecoration', venueDecorationSchema);
export default VenueDecoration;