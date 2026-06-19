import asyncHandler from '../middleware/asyncHandler.js';
import VenueLayout from '../models/venueLayoutModel.js';
import Event from '../models/eventModel.js';
import Seat from '../models/seatModel.js';
import expandVenueObjects from '../utils/expandVenueObjects.js';

// GET layout za događaj
const getVenueLayout = asyncHandler(async (req, res) => {
    const layout = await VenueLayout.findOne({ event: req.params.eventId });
    if (!layout) {
        return res.status(200).json(null);
    }
    res.status(200).json(layout);
});

// SAVE / UPDATE layout i sinhronizuj Seat kolekciju
const saveVenueLayout = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { canvasWidth, canvasHeight, objects } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    // Upsert layout
    const layout = await VenueLayout.findOneAndUpdate(
        { event: eventId },
        { event: eventId, canvasWidth, canvasHeight, objects },
        { new: true, upsert: true }
    );

    // Sinhronizuj Seat kolekciju — samo seat objekti (GA zone se razvijaju u pojedinačna sedišta)
    await Seat.deleteMany({ event: eventId });

    const seatObjects = expandVenueObjects(objects).filter(o => o.type === 'seat');

    if (seatObjects.length > 0) {
        const seatsToInsert = seatObjects.map(s => ({
            event: eventId,
            ticketType: s.ticketTypeId || event.ticketTypes[0]._id,
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

    res.status(200).json({ message: 'Layout sačuvan', layout });
});

export { getVenueLayout, saveVenueLayout };