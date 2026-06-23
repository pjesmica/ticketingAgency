import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import Event from "../models/eventModel.js";
import { reserveSeats, releaseSeats } from "./seatController.js";
import { sendTicketEmail } from "../utils/sendTicketEmail.js";
import { generateTicketPdf } from "../utils/generateTicketPdf.js";

// @desc    Kreiraj novu narudžbinu (kupi karte)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("Nema stavki u narudžbini");
  }

  const enrichedItems = [];
  for (const item of orderItems) {
    const event = await Event.findById(item.eventId);
    if (!event) {
      res.status(404);
      throw new Error(`Događaj nije pronađen: ${item.eventId}`);
    }

    const ticketType = event.ticketTypes.id(item.ticketTypeId);
    if (!ticketType) {
      res.status(404);
      throw new Error("Tip karte nije pronađen");
    }

    if (ticketType.availableQuantity < item.quantity) {
      res.status(400);
      throw new Error(
        `Nema dovoljno karata: ${event.name} (${ticketType.name})`
      );
    }

    ticketType.availableQuantity -= item.quantity;
    await event.save();

    enrichedItems.push({
      eventId: event._id,
      eventName: event.name,
      eventDate: event.startDate,
      eventVenue: event.venue
        ? [event.venue.name, event.venue.city].filter(Boolean).join(", ")
        : "",
      eventImage: item.eventImage || event.image || "",
      ticketType: ticketType.name,
      ticketTypeId: ticketType._id,
      price: ticketType.price,
      quantity: item.quantity,
      seats: item.seats || [],
    });
  }

  const totalPrice = enrichedItems.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0
  );

  const order = new Order({
    user: req.user._id,
    orderItems: enrichedItems,
    paymentMethod: paymentMethod || "PayPal",
    totalPrice,
  });

  const createdOrder = await order.save();

  for (const item of enrichedItems) {
    if (item.seats && item.seats.length > 0) {
      const seatIds = item.seats.map((s) => s.seatId);
      try {
        await reserveSeats(
          item.eventId,
          seatIds,
          req.user._id,
          createdOrder._id
        );
      } catch (err) {
        await Order.findByIdAndDelete(createdOrder._id);
        res.status(400);
        throw new Error(err.message);
      }
    }
  }

  res.status(201).json(createdOrder);
});

// @desc    Dobavi narudžbinu po ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    res.status(404);
    throw new Error("Narudžbina nije pronađena");
  }
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error("Nije autorizovano");
  }
  res.status(200).json(order);
});

// @desc    Ažuriraj narudžbinu na plaćeno (PayPal)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Narudžbina nije pronađena");
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer?.email_address,
  };
  const updated = await order.save();
  res.status(200).json(updated);

  try {
    const eventId = order.orderItems[0].eventId;
    console.log('[EMAIL] EventId:', eventId);
    const event = await Event.findById(eventId);
    console.log('[EMAIL] Event pronađen:', event ? event.name : 'NULL');
    if (event) {
      await sendTicketEmail({ order, event });
      console.log(`[EMAIL] Karte poslate na ${order.user?.email}`);
    }
  } catch (emailErr) {
    console.error("[EMAIL] Greška pri slanju karata:", emailErr.message);
  }
});

// @desc    Potvrdi besplatnu narudžbinu (totalPrice = 0)
// @route   PUT /api/orders/:id/free
// @access  Private
const confirmFreeOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Narudžbina nije pronađena");
  }
  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Nije autorizovano");
  }
  if (order.totalPrice !== 0) {
    res.status(400);
    throw new Error("Narudžbina nije besplatna");
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: "free",
    status: "COMPLETED",
    update_time: new Date().toISOString(),
    email_address: "",
  };
  const updated = await order.save();
  res.status(200).json(updated);

  try {
    const eventId = order.orderItems[0].eventId;
    console.log('[EMAIL] EventId:', eventId);
    const event = await Event.findById(eventId);
    console.log('[EMAIL] Event pronađen:', event ? event.name : 'NULL');
    if (event) {
      await sendTicketEmail({ order, event });
      console.log(`[EMAIL] Karte poslate na ${order.user?.email}`);
    }
  } catch (emailErr) {
    console.error("[EMAIL] Greška pri slanju karata:", emailErr.message);
  }
});

// @desc    Preuzmi PDF pojedinačne karte iz narudžbine
// @route   GET /api/orders/:id/tickets/:itemIndex/:qtyIndex/pdf
// @access  Private (vlasnik narudžbine ili admin)
const getOrderTicketPdf = asyncHandler(async (req, res) => {
  const { id, itemIndex, qtyIndex } = req.params;

  const order = await Order.findById(id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Narudžbina nije pronađena");
  }
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error("Nije autorizovano");
  }
  if (!order.isPaid) {
    res.status(400);
    throw new Error("Karta nije dostupna — narudžbina nije plaćena");
  }

  const itemIdx = parseInt(itemIndex, 10);
  const qIdx = parseInt(qtyIndex, 10);
  const orderItem = order.orderItems[itemIdx];

  if (!orderItem || isNaN(qIdx) || qIdx < 0 || qIdx >= orderItem.quantity) {
    res.status(404);
    throw new Error("Karta nije pronađena");
  }

  // Globalni indeks karte u okviru cele narudžbine — isti kao pri slanju mejla,
  // da barkod ostane konzistentan bez obzira da li je karta preuzeta ili poslata mejlom.
  let globalTicketIndex = 0;
  for (let i = 0; i < itemIdx; i++) {
    globalTicketIndex += order.orderItems[i].quantity;
  }
  globalTicketIndex += qIdx;

  const event = await Event.findById(orderItem.eventId);
  if (!event) {
    res.status(404);
    throw new Error("Događaj nije pronađen");
  }

  const pdfBuffer = await generateTicketPdf({
    order,
    orderItem,
    event,
    ticketIndex: globalTicketIndex,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="ulaznica-${globalTicketIndex + 1}.pdf"`
  );
  res.send(pdfBuffer);
});

// @desc    Dobavi narudžbine prijavljenog korisnika
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.status(200).json(orders);
});

// @desc    Dobavi sve narudžbine (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "id name email")
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

// @desc    Otkaži neplaćenu narudžbinu i oslobodi rezervisana sedišta
// @route   DELETE /api/orders/:id
// @access  Private (vlasnik narudžbine)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Narudžbina nije pronađena");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Nije autorizovano");
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error("Plaćena narudžbina se ne može otkazati");
  }

  // Oslobodi rezervisana sedišta
  await releaseSeats(order._id);

  // Vrati availableQuantity na eventu
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

  res.status(200).json({ message: "Narudžbina otkazana" });
});

export {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  confirmFreeOrder,
  getMyOrders,
  getOrders,
  getOrderTicketPdf,
  cancelOrder,
};