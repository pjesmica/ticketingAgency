import asyncHandler from '../middleware/asyncHandler.js';
import Event from '../models/eventModel.js';

// helper za search (čćšđž -> latin safe + lowercase)
const normalizeText = (text) =>
    text
        ?.toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s/g, '');

// @desc    Dobavi sve aktivne događaje
// @route   GET /api/events
// @access  Public
const getEvents = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword || '';
    const category = req.query.category || '';
    const date = req.query.date || '';

    const events = await Event.find({ isActive: true }).sort({ date: 1 });

    const normalizedKeyword = normalizeText(keyword);
    const normalizedDate = date ? new Date(date).toISOString().split('T')[0] : null;

    const filtered = events.filter((event) => {
        const haystack = normalizeText(
            `${event.name} ${event.category} ${event.venue?.city} ${event.venue?.name}`
        );

        const eventDate = event.date
            ? new Date(event.date).toISOString().split('T')[0]
            : null;

        const matchKeyword = normalizedKeyword
            ? haystack.includes(normalizedKeyword)
            : true;

        const matchCategory = category
            ? event.category === category
            : true;

        const matchDate = normalizedDate
            ? eventDate === normalizedDate
            : true;

        return matchKeyword && matchCategory && matchDate;
    });

    res.status(200).json(filtered);
});

// @desc    Dobavi sve događaje (admin)
// @route   GET /api/events/admin
// @access  Private/Admin
const getAllEventsAdmin = asyncHandler(async (req, res) => {
    const events = await Event.find({}).sort({ createdAt: -1 });
    res.status(200).json(events);
});

// @desc    Dobavi jedan događaj po ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (event) {
        res.status(200).json(event);
    } else {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }
});

// @desc    Kreiraj novi događaj
// @route   POST /api/events
// @access  Private/Admin
const createEvent = asyncHandler(async (req, res) => {
    const event = new Event({
        createdBy: req.user._id,
        name: req.body.name || 'Novi događaj',
        image: req.body.image || '/images/placeholder.jpg',
        description: req.body.description || 'Opis događaja',
        category: req.body.category || 'Ostalo',
        venue: req.body.venue || { name: 'Venue', city: 'Grad', address: '' },
        date: req.body.date || new Date(),
        time: req.body.time || '20:00',
        ticketTypes: req.body.ticketTypes || [
            {
                name: 'Regular',
                price: 0,
                totalQuantity: 100,
                availableQuantity: 100,
            },
        ],
        isActive: req.body.isActive !== undefined ? req.body.isActive : false,
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
});

// @desc    Ažuriraj događaj
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (event) {
        event.name = req.body.name || event.name;
        event.image = req.body.image || event.image;
        event.description = req.body.description || event.description;
        event.category = req.body.category || event.category;
        event.venue = req.body.venue || event.venue;
        event.date = req.body.date || event.date;
        event.time = req.body.time || event.time;
        event.ticketTypes = req.body.ticketTypes || event.ticketTypes;
        event.isActive =
            req.body.isActive !== undefined
                ? req.body.isActive
                : event.isActive;

        const updatedEvent = await event.save();
        res.status(200).json(updatedEvent);
    } else {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }
});

// @desc    Obriši događaj
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (event) {
        await Event.deleteOne({ _id: event._id });
        res.status(200).json({ message: 'Događaj uspešno obrisan' });
    } else {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }
});

export {
    getEvents,
    getAllEventsAdmin,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
};