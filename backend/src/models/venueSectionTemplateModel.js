import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    sectorType:  { type: String, enum: ['seated', 'standing'], default: 'seated' },
    x:           { type: Number, required: true },
    y:           { type: Number, required: true },
    width:       { type: Number, required: true },
    height:      { type: Number, required: true },
    angle:       { type: Number, default: 0 },
    shape:       { type: String, default: 'rect' },
    color:       { type: String, default: '#3b82f6' },
    rowCount:    { type: Number, default: 10 },
    seatsPerRow: { type: Number, default: 20 },
    rowStart:    { type: String, default: 'A' },
    seatStart:   { type: Number, default: 1 },
    rowLabels:   { type: [String], default: [] },
    blockedSeats: { type: [String], default: [] }, // "A-5", "C-12" itd.
    capacity:    { type: Number, default: 100 },
    // ticket type fields intentionally omitted —
    // they get assigned per-event when template is applied
}, { _id: false });

const decorationSchema = new mongoose.Schema({
    type:     { type: String, enum: ['stage', 'label', 'entrance', 'space'], required: true },
    x:        { type: Number, required: true },
    y:        { type: Number, required: true },
    width:    { type: Number, default: 120 },
    height:   { type: Number, default: 40 },
    label:    { type: String, default: '' },
    color:    { type: String, default: '#1f2937' },
    angle:    { type: Number, default: 0 },
    fontSize: { type: Number, default: 14 },
}, { _id: false });

const venueSectionTemplateSchema = new mongoose.Schema({
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    sections:    [sectionSchema],
    decorations: [decorationSchema],

    // Computed stats
    totalCapacity: { type: Number, default: 0 },
    sectionCount:  { type: Number, default: 0 },
}, { timestamps: true });

venueSectionTemplateSchema.pre('save', function () {
    this.sectionCount  = this.sections.length;
    this.totalCapacity = this.sections.reduce((sum, s) => {
        return sum + (s.sectorType === 'standing'
            ? (s.capacity || 0)
            : (s.rowCount || 0) * (s.seatsPerRow || 0));
    }, 0);
});

const VenueSectionTemplate = mongoose.model('VenueSectionTemplate', venueSectionTemplateSchema);
export default VenueSectionTemplate;