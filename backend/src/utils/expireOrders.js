import Order from '../models/orderModel.js';
import Event from '../models/eventModel.js';
import Seat from '../models/seatModel.js';

// Briše neplaćene narudžbine kojima je istekao rok (expiresAt <= sada),
// oslobađa rezervisana sedišta i vraća availableQuantity na event.
const expireUnpaidOrders = async () => {
    const expiredOrders = await Order.find({
        isPaid: false,
        expiresAt: { $lte: new Date() },
    });

    if (expiredOrders.length === 0) return;

    console.log(`[EXPIRE] Pronađeno ${expiredOrders.length} isteklih narudžbina — brišem...`);

    for (const order of expiredOrders) {
        try {
            // Oslobodi sedišta vezana za ovu narudžbinu (ako ih ima)
            await Seat.updateMany(
                { orderId: order._id },
                { isReserved: false, reservedBy: null, orderId: null }
            );

            // Vrati dostupnu količinu karata na događaju
            for (const item of order.orderItems) {
                const event = await Event.findById(item.eventId);
                if (event) {
                    const ticketType = event.ticketTypes.id(item.ticketTypeId);
                    if (ticketType) {
                        ticketType.availableQuantity += item.quantity;
                        await event.save();
                    }
                }
            }

            await Order.findByIdAndDelete(order._id);
            console.log(`[EXPIRE] Narudžbina ${order._id} obrisana, sedišta oslobođena.`);
        } catch (err) {
            console.error(`[EXPIRE] Greška pri brisanju narudžbine ${order._id}:`, err.message);
        }
    }
};

export default expireUnpaidOrders;