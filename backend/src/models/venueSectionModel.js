import mongoose from 'mongoose';

// Jedna sekcija sale (tribina, sektor, blok...)
// Sadrži vizuelnu definiciju + parametre generisanja sedišta
const venueSectionSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event',
    },

    // ── Vizuelno pozicioniranje (na mapi sale) ──
    x:      { type: Number, required: true },
    y:      { type: Number, required: true },
    width:  { type: Number, required: true },
    height: { type: Number, required: true },
    angle:  { type: Number, default: 0 },       // rotacija u stepenima
    shape:  { type: String, enum: ['rect', 'trapezoid', 'arc'], default: 'rect' },
    color:  { type: String, default: '#3b82f6' },

    // ── Identitet ──
    name:   { type: String, required: true },    // npr. "Tribina Sever", "VIP Loža"
    sectorType: {
        type: String,
        enum: ['seated', 'standing'],            // seated = numerisana sedišta, standing = GA zona
        default: 'seated',
    },

    // ── Sedišta (samo za 'seated') ──
    rowCount:    { type: Number, default: 10 },  // broj redova
    seatsPerRow: { type: Number, default: 20 },  // mesta po redu
    rowStart:    { type: String, default: 'A' }, // prva oznaka reda (A, B... ili 1, 2...)
    seatStart:   { type: Number, default: 1 },   // početni broj mesta
    rowLabels:   { type: [String], default: [] }, // override labela redova (ako je prazno, auto)
    blockedSeats: { type: [String], default: [] }, // format: "RedSlovo-BrojMesta" npr "A-5"

    // ── Kapacitet (samo za 'standing') ──
    capacity: { type: Number, default: 100 },

    // ── Karta / cena ──
    ticketTypeId:   { type: String, required: true },
    ticketTypeName: { type: String, required: true },
    price:          { type: Number, required: true },

    // ── Vizuelni dekorativi (ne-seat objekti) ──
    // bina, tekst oznake — čuvaju se posebno kao 'decorations'
}, { timestamps: true });

const VenueSection = mongoose.model('VenueSection', venueSectionSchema);
export default VenueSection;