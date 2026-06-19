import asyncHandler from '../middleware/asyncHandler.js';
import VenueSection from '../models/venueSectionModel.js';
import VenueDecoration from '../models/venueDecorationModel.js';
import Seat from '../models/seatModel.js';
import Event from '../models/eventModel.js';

// ── Helper: generiši labele redova ──────────────────────────────────────────
const generateRowLabels = (section) => {
    if (section.rowLabels?.length === section.rowCount) return section.rowLabels;

    const labels = [];
    const start = section.rowStart || 'A';

    // Ako je rowStart broj-string ("1"), koristi numeričke labele
    if (!isNaN(Number(start))) {
        const n = Number(start);
        for (let i = 0; i < section.rowCount; i++) labels.push(String(n + i));
    } else {
        // Slovna labela: A, B, ..., Z, AA, AB, ...
        const base = start.charCodeAt(0) - 65; // A=0
        for (let i = 0; i < section.rowCount; i++) {
            const code = base + i;
            if (code < 26) {
                labels.push(String.fromCharCode(65 + code));
            } else {
                // AA, AB...
                labels.push(String.fromCharCode(65 + Math.floor(code / 26) - 1) + String.fromCharCode(65 + (code % 26)));
            }
        }
    }
    return labels;
};

// ── Sačuvaj kompletnu konfiguraciju sale (sekcije + dekoracije) ─────────────
// @route  POST /api/venue-sections/:eventId
// @access Private/Admin
const saveVenueLayout = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { sections = [], decorations = [] } = req.body;

    const event = await Event.findById(eventId);
    if (!event) { res.status(404); throw new Error('Događaj nije pronađen'); }

    // Obrisi postojeće
    await VenueSection.deleteMany({ event: eventId });
    await VenueDecoration.deleteMany({ event: eventId });
    await Seat.deleteMany({ event: eventId });

    // Upiši sekcije — očisti frontend-specific polja
    const savedSections = sections.length
        ? await VenueSection.insertMany(
            sections.map(({ _localId, _id, ...s }) => ({ ...s, event: eventId }))
          )
        : [];

    // Upiši dekoracije — filtriraj nevažeće i očisti frontend-specific polja
    const validDecorations = decorations
        .filter(d => d.type && d.x != null && d.y != null)
        .map(({ _localId, _id, ...d }) => ({
            event:    eventId,
            type:     d.type,
            x:        Number(d.x),
            y:        Number(d.y),
            width:    d.width  || 120,
            height:   d.height || 40,
            label:    d.label  || '',
            color:    d.color  || '#1f2937',
            angle:    d.angle  || 0,
            fontSize: d.fontSize || 14,
        }));
    if (validDecorations.length) {
        await VenueDecoration.insertMany(validDecorations);
    }

    // Generiši Seat dokumente za svaku sekciju
    const seatsToInsert = [];
    for (const section of savedSections) {
        console.log(`Sekcija "${section.name}" — blockedSeats:`, section.blockedSeats?.length || 0, section.blockedSeats);
        if (section.sectorType === 'standing') {
            // GA zona: capacity individualnih seats sa row='GA', seatNumber 1..N
            const rowLabel = `GA-${section.name.replace(/\s+/g, '').toUpperCase().slice(0, 10)}`;
            for (let i = 1; i <= (section.capacity || 0); i++) {
                seatsToInsert.push({
                    event: eventId,
                    section: section._id,
                    ticketType:     section.ticketTypeId,
                    ticketTypeName: section.ticketTypeName,
                    row:            rowLabel,
                    seatNumber:     i,
                    sector:         section.name,
                    price:          section.price,
                    isReserved:     false,
                });
            }
        } else {
            // Seated: rowCount × seatsPerRow, blokirana mesta = isBlocked + isReserved
            const rowLabels = generateRowLabels(section);
            const blocked   = new Set(section.blockedSeats || []);
            for (let r = 0; r < section.rowCount; r++) {
                for (let s = 0; s < section.seatsPerRow; s++) {
                    const seatNum  = (section.seatStart || 1) + s;
                    const key      = `${rowLabels[r]}-${seatNum}`;
                    const isBlocked = blocked.has(key);
                    seatsToInsert.push({
                        event: eventId,
                        section: section._id,
                        ticketType:     section.ticketTypeId,
                        ticketTypeName: section.ticketTypeName,
                        row:            rowLabels[r],
                        seatNumber:     seatNum,
                        sector:         section.name,
                        price:          section.price,
                        isReserved:     isBlocked, // blokirano = ne može se rezervisati
                        isBlocked:      isBlocked,
                    });
                }
            }
        }
    }

    if (seatsToInsert.length) await Seat.insertMany(seatsToInsert);

    // Ažuriraj hasSeatMap na eventu
    event.hasSeatMap = savedSections.length > 0;
    await event.save();

    res.status(200).json({
        message: `Sala sačuvana — ${savedSections.length} sekcija, ${seatsToInsert.length} sedišta`,
        sectionCount: savedSections.length,
        seatCount: seatsToInsert.length,
        sections: savedSections,
    });
});

// ── Učitaj layout sale ───────────────────────────────────────────────────────
// @route  GET /api/venue-sections/:eventId
// @access Public
const getVenueLayout = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const sections    = await VenueSection.find({ event: eventId });
    const decorations = await VenueDecoration.find({ event: eventId });
    res.json({ sections, decorations });
});

export { saveVenueLayout, getVenueLayout };