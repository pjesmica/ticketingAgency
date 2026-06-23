import asyncHandler from '../middleware/asyncHandler.js';
import Event from '../models/eventModel.js';
import Order from '../models/orderModel.js';

const normalizeText = (text) =>
    text
        ?.toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s/g, '');

const toBoolean = (value) => value === true || value === 'true';

// -----------------------------
// SYNC STATUS
// -----------------------------
const syncEventStatus = async () => {
    const now = new Date();

    await Event.updateMany(
        {
            startDate: { $lte: now },
            endDate: { $gte: now },
        },
        { $set: { isActive: true } }
    );

    await Event.updateMany(
        {
            endDate: { $lt: now },
        },
        { $set: { isActive: false } }
    );
};

// -----------------------------
// GET EVENTS
// -----------------------------
const getEvents = asyncHandler(async (req, res) => {
    await syncEventStatus();

    const keyword = req.query.keyword || '';
    const category = req.query.category || '';

    const events = await Event.find({
        endDate: { $gte: new Date() },
    }).sort({ startDate: 1 });

    const normalizedKeyword = normalizeText(keyword);

    const filtered = events.filter((event) => {
        const haystack = normalizeText(
            `${event.name} ${event.category} ${event.venue?.city} ${event.venue?.name}`
        );

        const matchKeyword = normalizedKeyword
            ? haystack.includes(normalizedKeyword)
            : true;

        const matchCategory = category
            ? event.category === category
            : true;

        return matchKeyword && matchCategory;
    });

    res.status(200).json(filtered);
});

// -----------------------------
// GET ALL EVENTS (ADMIN)
// -----------------------------
const getAllEventsAdmin = asyncHandler(async (req, res) => {
    await syncEventStatus();

    const events = await Event.find({}).sort({ startDate: -1 });

    res.status(200).json(events);
});

// -----------------------------
// GET BY ID
// -----------------------------
const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    res.status(200).json(event);
});

// -----------------------------
// CREATE EVENT
// -----------------------------
const createEvent = asyncHandler(async (req, res) => {
    const start = req.body.startDate
        ? new Date(req.body.startDate)
        : new Date();

    const end = req.body.endDate
        ? new Date(req.body.endDate)
        : new Date();

    // kraj dana
    end.setHours(23, 59, 59, 999);

    const event = new Event({
        createdBy: req.user._id,
        name: req.body.name || 'Novi događaj',
        image: req.body.image || '/images/placeholder.jpg',
        ticketImage: req.body.ticketImage || '',
        description: req.body.description || '',
        category: req.body.category || 'Ostalo',

        venue: req.body.venue || {
            name: 'Venue',
            city: 'Grad',
            address: '',
        },

        startDate: start,
        endDate: end,

        ticketTypes: req.body.ticketTypes || [
            {
                name: 'Regular',
                price: 0,
                totalQuantity: 100,
                availableQuantity: 100,
            },
        ],

        isActive: true,
        hasSeatMap: toBoolean(req.body.hasSeatMap),
    });

    const created = await event.save();
    res.status(201).json(created);
});

// -----------------------------
// UPDATE EVENT
// -----------------------------
const updateEvent = asyncHandler(async (req, res) => {
    await syncEventStatus();

    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    event.name = req.body.name !== undefined ? req.body.name : event.name;
    event.image = req.body.image !== undefined ? req.body.image : event.image;

    event.ticketImage =
        req.body.ticketImage !== undefined
            ? req.body.ticketImage
            : event.ticketImage;

    event.description = req.body.description !== undefined ? req.body.description : event.description;
    event.category = req.body.category !== undefined ? req.body.category : event.category;
    event.venue = req.body.venue !== undefined ? req.body.venue : event.venue;

    if (req.body.startDate) {
        event.startDate = new Date(req.body.startDate);
    }

    if (req.body.endDate) {
        const end = new Date(req.body.endDate);
        end.setHours(23, 59, 59, 999);
        event.endDate = end;
    }

    event.ticketTypes = req.body.ticketTypes !== undefined ? req.body.ticketTypes : event.ticketTypes;

    // realtime status
    event.isActive = new Date() <= new Date(event.endDate);

    event.hasSeatMap = toBoolean(req.body.hasSeatMap);

    const updated = await event.save();
    res.status(200).json(updated);
});

// -----------------------------
// DELETE EVENT
// -----------------------------
const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    await Event.deleteOne({ _id: event._id });

    res.status(200).json({ message: 'Događaj obrisan' });
});

// -----------------------------
// LISTA BARKODOVA ZA DOGAĐAJ (ADMIN)
// -----------------------------
// Barkod se NE čuva u bazi — generiše se uvek iznova kao `${order._id}-${ticketIndex}`
// (ista logika kao u generateTicketPdf.js). Ova ruta tu logiku ponavlja za sve
// PLAĆENE narudžbine koje sadrže ovaj događaj, da admin dobije kompletnu listu
// barkodova koji se fizički nalaze na izdatim e-ulaznicama.
const getEventBarcodes = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    const orders = await Order.find({
        isPaid: true,
        'orderItems.eventId': event._id,
    })
        .populate('user', 'name email')
        .sort({ createdAt: 1 });

    const tickets = [];

    for (const order of orders) {
        // Globalni indeks karte unutar cele narudžbine — mora ići kroz SVE stavke
        // narudžbine (ne samo one za ovaj događaj), jer se tako računa i pri
        // generisanju PDF-a / slanju mejla.
        let globalTicketIndex = 0;

        for (const item of order.orderItems) {
            const belongsToEvent = item.eventId.toString() === event._id.toString();

            for (let q = 0; q < item.quantity; q++) {
                if (belongsToEvent) {
                    const seat = item.seats?.[q] || null;
                    tickets.push({
                        barcode: `${order._id}-${globalTicketIndex}`,
                        orderId: order._id.toString(),
                        kupac: order.user?.name || 'N/A',
                        email: order.user?.email || 'N/A',
                        ticketType: item.ticketType,
                        sektor: seat?.sector || '',
                        red: seat?.row || '',
                        mesto: seat?.seatNumber || '',
                        placeno: order.paidAt,
                    });
                }
                globalTicketIndex++;
            }
        }
    }

    res.status(200).json({
        event: { _id: event._id, name: event.name },
        count: tickets.length,
        tickets,
    });
});

export {
    getEvents,
    getAllEventsAdmin,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventBarcodes,
};