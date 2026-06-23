import asyncHandler from '../middleware/asyncHandler.js';
import Seat from '../models/seatModel.js';
import Event from '../models/eventModel.js';

// @desc    Dobavi sva sedišta za događaj
// @route   GET /api/seats/:eventId
// @access  Public
const getSeatsForEvent = asyncHandler(async (req, res) => {
    const seats = await Seat.find({ event: req.params.eventId }).sort({ sector: 1, row: 1, seatNumber: 1 });

    if (!seats || seats.length === 0) {
        res.status(404);
        throw new Error('Nema sedišta za ovaj događaj. Admin treba da generiše sedišta.');
    }

    res.status(200).json(seats);
});


// @desc    Generiši sedišta za događaj (Admin)
// @route   POST /api/seats/generate/:eventId
// @access  Private/Admin
//
// Layout dvorane:
//   PARTER  — 15 redova (A-O), 20 mesta po redu
//   VIP     —  3 reda (VIP1-VIP3), 10 mesta po redu
//   BALKON  —  5 redova (BAL1-BAL5), 25 mesta po redu
//
// Ticket types se mapiraju na sektore po imenu:
//   "VIP" (case-insensitive)    → sektor VIP
//   "Balkon" / "Balcony"        → sektor Balkon
//   sve ostalo                  → sektor Parter
const generateSeats = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
        res.status(404);
        throw new Error('Događaj nije pronađen');
    }

    // Obriši postojeća sedišta za ovaj događaj
    await Seat.deleteMany({ event: event._id });

    const sectorLayout = [
        {
            sector: 'Parter',
            rows: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'],
            seatsPerRow: 20,
        },
        {
            sector: 'VIP',
            rows: ['VIP1','VIP2','VIP3'],
            seatsPerRow: 10,
        },
        {
            sector: 'Balkon',
            rows: ['BAL1','BAL2','BAL3','BAL4','BAL5'],
            seatsPerRow: 25,
        },
    ];

    // Pronađi ticket type za svaki sektor
    const getTicketType = (sectorName) => {
        const name = sectorName.toLowerCase();
        if (name === 'vip') {
            return event.ticketTypes.find((t) => t.name.toLowerCase().includes('vip'))
                || event.ticketTypes[0];
        }
        if (name === 'balkon') {
            return event.ticketTypes.find((t) =>
                t.name.toLowerCase().includes('balkon') ||
                t.name.toLowerCase().includes('balcony')
            ) || event.ticketTypes[event.ticketTypes.length - 1];
        }
        // Parter = Regular / prvi tip
        return event.ticketTypes.find((t) =>
            t.name.toLowerCase().includes('regular') ||
            t.name.toLowerCase().includes('parter') ||
            t.name.toLowerCase().includes('standard')
        ) || event.ticketTypes[0];
    };

    const seatsToInsert = [];

    for (const { sector, rows, seatsPerRow } of sectorLayout) {
        const ticketType = getTicketType(sector);
        for (const row of rows) {
            for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
                seatsToInsert.push({
                    event: event._id,
                    ticketType: ticketType._id,
                    ticketTypeName: ticketType.name,
                    row,
                    seatNumber: seatNum,
                    sector,
                    price: ticketType.price,
                    isReserved: false,
                    reservedBy: null,
                    orderId: null,
                });
            }
        }
    }

    const created = await Seat.insertMany(seatsToInsert);

    res.status(201).json({
        message: `Generisano ${created.length} sedišta za događaj "${event.name}"`,
        count: created.length,
    });
});


// @desc    Rezerviši sedišta (interno — poziva se iz orderController)
// @access  Private (internal use)
const reserveSeats = async (eventId, seatIds, userId, orderId) => {
    const seats = await Seat.find({ _id: { $in: seatIds }, event: eventId });

    if (seats.length !== seatIds.length) {
        throw new Error('Neka sedišta nisu pronađena');
    }

    const alreadyTaken = seats.filter((s) => s.isReserved);
    if (alreadyTaken.length > 0) {
        throw new Error(
            `Sedišta su već zauzeta: ${alreadyTaken.map((s) => `${s.row}${s.seatNumber}`).join(', ')}`
        );
    }

    await Seat.updateMany(
        { _id: { $in: seatIds } },
        { isReserved: true, reservedBy: userId, orderId }
    );
};

// Oslobađa sva sedišta vezana za narudžbinu — koristi se pri otkazivanju
const releaseSeats = async (orderId) => {
    await Seat.updateMany(
        { orderId },
        { isReserved: false, reservedBy: null, orderId: null }
    );
};

export { getSeatsForEvent, generateSeats, reserveSeats, releaseSeats };