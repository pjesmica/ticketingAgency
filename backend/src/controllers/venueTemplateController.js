import asyncHandler from '../middleware/asyncHandler.js';
import VenueTemplate from '../models/venueTemplateModel.js';
import VenueLayout from '../models/venueLayoutModel.js';
import Event from '../models/eventModel.js';
import Seat from '../models/seatModel.js';
import expandVenueObjects from '../utils/expandVenueObjects.js';

// GET sve šablone
const getVenueTemplates = asyncHandler(async (req, res) => {
    const templates = await VenueTemplate.find({})
        .select('name description seatCount canvasWidth canvasHeight createdAt createdBy')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json(templates);
});

// GET jedan šablon
const getVenueTemplateById = asyncHandler(async (req, res) => {
    const template = await VenueTemplate.findById(req.params.id);
    if (!template) {
        res.status(404);
        throw new Error('Šablon nije pronađen');
    }
    res.status(200).json(template);
});

// CREATE šablon iz postojećeg layouta (iz buildera)
const createVenueTemplate = asyncHandler(async (req, res) => {
    const { name, description, canvasWidth, canvasHeight, objects } = req.body;

    if (!name || !objects) {
        res.status(400);
        throw new Error('Naziv i objekti su obavezni');
    }

    const template = new VenueTemplate({
        name,
        description: description || '',
        createdBy: req.user._id,
        canvasWidth,
        canvasHeight,
        objects,
    });

    const saved = await template.save();
    res.status(201).json(saved);
});

// UPDATE šablon
const updateVenueTemplate = asyncHandler(async (req, res) => {
    const template = await VenueTemplate.findById(req.params.id);
    if (!template) {
        res.status(404);
        throw new Error('Šablon nije pronađen');
    }

    template.name = req.body.name || template.name;
    template.description = req.body.description ?? template.description;
    if (req.body.objects) {
        template.objects = req.body.objects;
        template.canvasWidth = req.body.canvasWidth || template.canvasWidth;
        template.canvasHeight = req.body.canvasHeight || template.canvasHeight;
    }

    const updated = await template.save();
    res.status(200).json(updated);
});

// DELETE šablon
const deleteVenueTemplate = asyncHandler(async (req, res) => {
    const template = await VenueTemplate.findById(req.params.id);
    if (!template) {
        res.status(404);
        throw new Error('Šablon nije pronađen');
    }

    await VenueTemplate.deleteOne({ _id: template._id });
    res.status(200).json({ message: 'Šablon obrisan' });
});

// APPLY šablon na dogadjaj — kopira objekte i sinhronizuje Seat kolekciju
const applyVenueTemplate = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { templateId, ticketTypeMappings } = req.body;
    // ticketTypeMappings: { oldTicketTypeName: { newId, newName, newPrice } }

    const template = await VenueTemplate.findById(templateId);
    if (!template) {
        res.status(404);
        throw new Error('Šablon nije pronađen');
    }

    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    // Remap ticket types ako su prosleđeni
    let objects = template.objects.map(obj => {
        const o = obj.toObject ? obj.toObject() : { ...obj };

        if ((o.type === 'seat' || o.type === 'gazone') && ticketTypeMappings) {
            const mapping = ticketTypeMappings[o.sector] || ticketTypeMappings[o.ticketTypeName];
            if (mapping) {
                return {
                    ...o,
                    ticketTypeId: mapping.newId,
                    ticketTypeName: mapping.newName,
                    price: mapping.newPrice,
                };
            }
        }
        return o;
    });

    // Ako nema mappings, pokušaj povezati po nazivu sektora sa vrstama karata dogadjaja,
    // a ako nema poklapanja, koristi prvi tip karte kao rezervu
    if (!ticketTypeMappings && event.ticketTypes?.length > 0) {
        const firstTT = event.ticketTypes[0];
        objects = objects.map(o => {
            if (o.type !== 'seat' && o.type !== 'gazone') return o;
            const sectorKey = o.sector || o.ticketTypeName;
            const matched = event.ticketTypes.find(t => t.name === sectorKey) || firstTT;
            return {
                ...o,
                ticketTypeId: matched._id.toString(),
                ticketTypeName: matched.name,
                price: matched.price,
            };
        });
    }

    // Upsert layout za ovaj dogadjaj
    const layout = await VenueLayout.findOneAndUpdate(
        { event: eventId },
        {
            event: eventId,
            canvasWidth: template.canvasWidth,
            canvasHeight: template.canvasHeight,
            objects,
        },
        { new: true, upsert: true }
    );

    // Sinhronizuj Seat kolekciju (GA zone se razvijaju u pojedinačna sedišta)
    await Seat.deleteMany({ event: eventId });

    const seatObjects = expandVenueObjects(objects).filter(o => o.type === 'seat');
    if (seatObjects.length > 0) {
        const seatsToInsert = seatObjects.map(s => ({
            event: eventId,
            ticketType: s.ticketTypeId || event.ticketTypes[0]?._id,
            ticketTypeName: s.ticketTypeName || event.ticketTypes[0]?.name || 'Regular',
            row: s.row || 'A',
            seatNumber: s.seatNumber || 1,
            sector: s.sector || 'Parter',
            price: s.price || 0,
            isReserved: false,
            reservedBy: null,
            orderId: null,
        }));

        await Seat.insertMany(seatsToInsert);
    }

    // Postavi hasSeatMap na true
    await Event.findByIdAndUpdate(eventId, { hasSeatMap: true });

    res.status(200).json({
        message: `Šablon "${template.name}" uspešno primenjen`,
        layout,
        seatsCreated: seatObjects.length,
    });
});

export {
    getVenueTemplates,
    getVenueTemplateById,
    createVenueTemplate,
    updateVenueTemplate,
    deleteVenueTemplate,
    applyVenueTemplate,
};