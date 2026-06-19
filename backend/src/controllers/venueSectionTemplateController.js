import asyncHandler from '../middleware/asyncHandler.js';
import VenueSectionTemplate from '../models/venueSectionTemplateModel.js';
import VenueSection from '../models/venueSectionModel.js';
import VenueDecoration from '../models/venueDecorationModel.js';
import Seat from '../models/seatModel.js';
import Event from '../models/eventModel.js';

// ── Generiši row labele ───────────────────────────────────────────────────────
const generateRowLabels = (section) => {
    if (section.rowLabels?.length === section.rowCount) return section.rowLabels;
    const labels = [];
    const start  = section.rowStart || 'A';
    if (!isNaN(Number(start))) {
        const n = Number(start);
        for (let i = 0; i < section.rowCount; i++) labels.push(String(n + i));
    } else {
        const base = start.charCodeAt(0) - 65;
        for (let i = 0; i < section.rowCount; i++) {
            const code = base + i;
            labels.push(code < 26
                ? String.fromCharCode(65 + code)
                : String.fromCharCode(65 + Math.floor(code / 26) - 1) + String.fromCharCode(65 + (code % 26)));
        }
    }
    return labels;
};

// ── GET sve šablone ───────────────────────────────────────────────────────────
export const getVenueSectionTemplates = asyncHandler(async (req, res) => {
    const templates = await VenueSectionTemplate.find({})
        .select('name description totalCapacity sectionCount sections createdAt createdBy')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });
    res.json(templates);
});

// ── GET jedan šablon ──────────────────────────────────────────────────────────
export const getVenueSectionTemplateById = asyncHandler(async (req, res) => {
    const t = await VenueSectionTemplate.findById(req.params.id);
    if (!t) { res.status(404); throw new Error('Šablon nije pronađen'); }
    res.json(t);
});

// ── CREATE šablon ─────────────────────────────────────────────────────────────
export const createVenueSectionTemplate = asyncHandler(async (req, res) => {
    const { name, description, sections, decorations } = req.body;
    console.log('CREATE TEMPLATE req.body.sections[0].blockedSeats:', sections?.[0]?.blockedSeats);
    if (!name?.trim()) { res.status(400); throw new Error('Naziv je obavezan'); }
    if (!sections?.length) { res.status(400); throw new Error('Šablon mora imati bar jednu sekciju'); }

    // Strip event-specific fields (ticketTypeId/Name/price) before saving as template
    const cleanSections = sections.map(({ ticketTypeId, ticketTypeName, price, _id, ...rest }) => rest);
    const cleanDecorations = (decorations || []).map(({ _id, ...rest }) => rest);

    const template = new VenueSectionTemplate({
        name: name.trim(),
        description: description?.trim() || '',
        createdBy: req.user._id,
        sections:    cleanSections,
        decorations: cleanDecorations,
    });

    const saved = await template.save();
    console.log('Šablon sačuvan — sekcije blockedSeats:', saved.sections.map(s => ({ name: s.name, blockedSeats: s.blockedSeats })));
    res.status(201).json(saved);
});

// ── UPDATE šablon ─────────────────────────────────────────────────────────────
export const updateVenueSectionTemplate = asyncHandler(async (req, res) => {
    const t = await VenueSectionTemplate.findById(req.params.id);
    if (!t) { res.status(404); throw new Error('Šablon nije pronađen'); }

    t.name        = req.body.name?.trim() || t.name;
    t.description = req.body.description ?? t.description;

    const saved = await t.save();
    res.json(saved);
});

// ── DELETE šablon ─────────────────────────────────────────────────────────────
export const deleteVenueSectionTemplate = asyncHandler(async (req, res) => {
    const t = await VenueSectionTemplate.findById(req.params.id);
    if (!t) { res.status(404); throw new Error('Šablon nije pronađen'); }
    await VenueSectionTemplate.deleteOne({ _id: t._id });
    res.json({ message: 'Šablon obrisan' });
});

// ── APPLY šablon na događaj ───────────────────────────────────────────────────
// Mapira sekcije šablona na ticket types događaja po imenu sekcije,
// generiše VenueSection + Seat dokumente
export const applyVenueSectionTemplate = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { templateId, ticketMappings } = req.body;
    // ticketMappings: { "Tribina Sever": { ticketTypeId, ticketTypeName, price }, ... }

    const template = await VenueSectionTemplate.findById(templateId);
    if (!template) { res.status(404); throw new Error('Šablon nije pronađen'); }
    console.log('Učitan šablon za primenu — sekcije blockedSeats:', template.sections.map(s => ({ name: s.name, blockedSeats: s.blockedSeats })));

    const event = await Event.findById(eventId);
    if (!event) { res.status(404); throw new Error('Događaj nije pronađen'); }

    // Obriši postojeće
    await VenueSection.deleteMany({ event: eventId });
    await VenueDecoration.deleteMany({ event: eventId });
    await Seat.deleteMany({ event: eventId });

    // Mapiranje ticket types: po imenu sekcije ili fallback na prvi ticket type
    const firstTT = event.ticketTypes?.[0];
    const mapSection = (s) => {
        const mapping = ticketMappings?.[s.name];
        if (mapping) return { ticketTypeId: mapping.ticketTypeId, ticketTypeName: mapping.ticketTypeName, price: mapping.price };
        // Pokušaj automatsko mapiranje po imenu sekcije = imenu ticket type-a
        const autoMatch = event.ticketTypes?.find(t => t.name === s.name);
        if (autoMatch) return { ticketTypeId: autoMatch._id.toString(), ticketTypeName: autoMatch.name, price: autoMatch.price };
        // Fallback: prvi ticket type
        return { ticketTypeId: firstTT?._id?.toString() || '', ticketTypeName: firstTT?.name || 'Regular', price: firstTT?.price || 0 };
    };

    // Kreiraj VenueSection dokumente
    const sectionsToInsert = template.sections.map(s => ({
        event: eventId,
        name:        s.name,
        sectorType:  s.sectorType,
        x: s.x, y: s.y, width: s.width, height: s.height,
        angle: s.angle, shape: s.shape, color: s.color,
        rowCount:    s.rowCount,
        seatsPerRow: s.seatsPerRow,
        rowStart:    s.rowStart,
        seatStart:   s.seatStart,
        rowLabels:   s.rowLabels,
        capacity:    s.capacity,
        blockedSeats: s.blockedSeats || [],
        ...mapSection(s),
    }));

    const savedSections = await VenueSection.insertMany(sectionsToInsert);

    // Kreiraj Decoration dokumente
    if (template.decorations?.length) {
        const decorationsToInsert = template.decorations
            .filter(d => d.type && d.x != null && d.y != null)
            .map(d => ({
                event:    eventId,
                type:     d.type,
                x:        d.x,
                y:        d.y,
                width:    d.width  || 120,
                height:   d.height || 40,
                label:    d.label  || '',
                color:    d.color  || '#1f2937',
                angle:    d.angle  || 0,
                fontSize: d.fontSize || 14,
            }));
        if (decorationsToInsert.length) {
            await VenueDecoration.insertMany(decorationsToInsert);
        }
    }

    // Generiši Seat dokumente
    const seatsToInsert = [];
    for (const section of savedSections) {
        console.log(`Apply "${section.name}" — blockedSeats:`, section.blockedSeats?.length || 0, section.blockedSeats);
        if (section.sectorType === 'standing') {
            const rowLabel = `GA-${section.name.replace(/\s+/g, '').toUpperCase().slice(0, 10)}`;
            for (let i = 1; i <= (section.capacity || 0); i++) {
                seatsToInsert.push({
                    event: eventId, section: section._id,
                    ticketType: section.ticketTypeId, ticketTypeName: section.ticketTypeName,
                    row: rowLabel, seatNumber: i,
                    sector: section.name, price: section.price, isReserved: false,
                });
            }
        } else {
            const rowLabels = generateRowLabels(section);
            const blocked   = new Set(section.blockedSeats || []);
            for (let r = 0; r < section.rowCount; r++) {
                for (let s = 0; s < section.seatsPerRow; s++) {
                    const seatNum   = (section.seatStart || 1) + s;
                    const key       = `${rowLabels[r]}-${seatNum}`;
                    const isBlocked = blocked.has(key);
                    seatsToInsert.push({
                        event: eventId, section: section._id,
                        ticketType: section.ticketTypeId, ticketTypeName: section.ticketTypeName,
                        row: rowLabels[r], seatNumber: seatNum,
                        sector: section.name, price: section.price,
                        isReserved: isBlocked,
                        isBlocked:  isBlocked,
                    });
                }
            }
        }
    }

    if (seatsToInsert.length) await Seat.insertMany(seatsToInsert);

    event.hasSeatMap = true;
    await event.save();

    res.json({
        message: `Šablon "${template.name}" primenjen — ${savedSections.length} sekcija, ${seatsToInsert.length} sedišta`,
        sectionCount: savedSections.length,
        seatCount: seatsToInsert.length,
    });
});