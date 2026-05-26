import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card, Spinner, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaTicketAlt } from 'react-icons/fa';
import { useGetSeatsForEventQuery } from '../slices/seatsApiSlice';
import { useGetEventDetailsQuery } from '../slices/eventsApiSlice';
import { addToCart } from '../slices/cartSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

// Boje sektora
const SECTOR_COLORS = {
    Parter:  { free: '#4ade80', hover: '#16a34a', reserved: '#e5e7eb', selected: '#f97316' },
    VIP:     { free: '#facc15', hover: '#ca8a04', reserved: '#e5e7eb', selected: '#f97316' },
    Balkon:  { free: '#60a5fa', hover: '#2563eb', reserved: '#e5e7eb', selected: '#f97316' },
};

const SEAT_SIZE = 22;
const SEAT_GAP = 4;

const SeatMapScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);

    const { data: seats, isLoading: loadingSeats, error: errorSeats } = useGetSeatsForEventQuery(id);
    const { data: event, isLoading: loadingEvent } = useGetEventDetailsQuery(id);

    const [selected, setSelected] = useState(new Set()); // Set of seat _id strings

    // Grupiši sedišta po sektoru pa redu
    const grouped = useMemo(() => {
        if (!seats) return {};
        return seats.reduce((acc, seat) => {
            if (!acc[seat.sector]) acc[seat.sector] = {};
            if (!acc[seat.sector][seat.row]) acc[seat.sector][seat.row] = [];
            acc[seat.sector][seat.row].push(seat);
            return acc;
        }, {});
    }, [seats]);

    const toggleSeat = (seat) => {
        if (seat.isReserved) return;
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(seat._id)) {
                next.delete(seat._id);
            } else {
                next.add(seat._id);
            }
            return next;
        });
    };

    const selectedSeats = seats ? seats.filter((s) => selected.has(s._id)) : [];

    // Grupiši selektovana sedišta po ticketType za korpu
    const selectedByType = useMemo(() => {
        return selectedSeats.reduce((acc, seat) => {
            const key = seat.ticketType.toString();
            if (!acc[key]) {
                acc[key] = {
                    ticketTypeId: seat.ticketType,
                    ticketTypeName: seat.ticketTypeName,
                    price: seat.price,
                    seats: [],
                };
            }
            acc[key].seats.push(seat);
            return acc;
        }, {});
    }, [selectedSeats]);

    const totalPrice = selectedSeats.reduce((a, s) => a + s.price, 0);

    const handleAddToCart = () => {
        if (!userInfo) {
            toast.info('Morate biti prijavljeni');
            navigate(`/login?redirect=/events/${id}/seats`);
            return;
        }
        if (selected.size === 0) {
            toast.warning('Izaberite bar jedno sedište');
            return;
        }

        Object.values(selectedByType).forEach(({ ticketTypeId, ticketTypeName, price, seats: typeSeats }) => {
            dispatch(addToCart({
                eventId: event._id,
                eventName: event.name,
                eventDate: event.date,
                eventVenue: event.venue ? `${event.venue.name}, ${event.venue.city}` : '',
                eventImage: event.image,
                ticketTypeId,
                ticketType: ticketTypeName,
                price,
                quantity: typeSeats.length,
                seats: typeSeats.map((s) => ({
                    seatId: s._id,
                    row: s.row,
                    seatNumber: s.seatNumber,
                    sector: s.sector,
                })),
            }));
        });

        toast.success(`${selected.size} sedišt${selected.size === 1 ? 'e dodato' : 'a dodato'} u korpu!`);
        navigate('/cart');
    };

    if (loadingSeats || loadingEvent) return <Loader />;
    if (errorSeats) return <Message variant="danger">{errorSeats?.data?.message || 'Greška pri učitavanju sedišta'}</Message>;

    const sectorOrder = ['VIP', 'Parter', 'Balkon'];

    return (
        <div className="py-3">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" /> Nazad
            </Button>

            <h4 className="mb-1">{event?.name}</h4>
            <p className="text-muted small mb-4">
                Kliknite na sedište da ga izaberete. Narandžasto = izabrano.
            </p>

            <Row className="g-4">
                {/* MAPA DVORANE */}
                <Col lg={9}>

                    {/* POZORNICA */}
                    <div className="text-center mb-4">
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #1e293b, #334155)',
                                color: '#fff',
                                borderRadius: '12px 12px 0 0',
                                padding: '10px 40px',
                                display: 'inline-block',
                                fontSize: '0.9rem',
                                letterSpacing: '4px',
                                fontWeight: 700,
                                minWidth: '260px',
                            }}
                        >
                            ★ POZORNICA ★
                        </div>
                    </div>

                    {/* SEKTORI */}
                    {sectorOrder.filter((s) => grouped[s]).map((sectorName) => {
                        const colors = SECTOR_COLORS[sectorName];
                        const rows = grouped[sectorName];

                        return (
                            <div key={sectorName} className="mb-4">
                                {/* Sektor naslov */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div
                                        style={{
                                            width: 14, height: 14,
                                            borderRadius: 3,
                                            backgroundColor: colors.free,
                                        }}
                                    />
                                    <span className="fw-bold text-uppercase small" style={{ letterSpacing: 1 }}>
                                        {sectorName}
                                    </span>
                                    <span className="text-muted small">
                                        — {seats.filter(s => s.sector === sectorName && !s.isReserved).length} slobodnih
                                    </span>
                                </div>

                                {/* Redovi */}
                                <div
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 10,
                                        padding: '12px 16px',
                                        overflowX: 'auto',
                                    }}
                                >
                                    {Object.entries(rows).map(([row, rowSeats]) => (
                                        <div
                                            key={row}
                                            className="d-flex align-items-center mb-1"
                                            style={{ gap: SEAT_GAP }}
                                        >
                                            {/* Oznaka reda */}
                                            <span
                                                style={{
                                                    width: 36,
                                                    fontSize: '0.7rem',
                                                    color: '#64748b',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    textAlign: 'right',
                                                    paddingRight: 6,
                                                }}
                                            >
                                                {row}
                                            </span>

                                            {/* Sedišta */}
                                            {rowSeats.map((seat) => {
                                                const isSelected = selected.has(seat._id);
                                                const isReserved = seat.isReserved;

                                                let bg = colors.free;
                                                if (isReserved) bg = colors.reserved;
                                                else if (isSelected) bg = colors.selected;

                                                return (
                                                    <div
                                                        key={seat._id}
                                                        onClick={() => toggleSeat(seat)}
                                                        title={
                                                            isReserved
                                                                ? 'Zauzeto'
                                                                : `${sectorName} — Red ${row}, Mesto ${seat.seatNumber}\n${seat.price} RSD`
                                                        }
                                                        style={{
                                                            width: SEAT_SIZE,
                                                            height: SEAT_SIZE,
                                                            borderRadius: '4px 4px 0 0',
                                                            backgroundColor: bg,
                                                            border: isSelected ? '2px solid #ea580c' : '1px solid rgba(0,0,0,0.1)',
                                                            cursor: isReserved ? 'not-allowed' : 'pointer',
                                                            transition: 'transform 0.1s, background 0.1s',
                                                            flexShrink: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.55rem',
                                                            color: isReserved ? '#9ca3af' : '#1e293b',
                                                            fontWeight: 600,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isReserved && !isSelected) {
                                                                e.currentTarget.style.backgroundColor = colors.hover;
                                                                e.currentTarget.style.transform = 'scale(1.15)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isReserved && !isSelected) {
                                                                e.currentTarget.style.backgroundColor = colors.free;
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }
                                                        }}
                                                    >
                                                        {seat.seatNumber}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* LEGENDA */}
                    <div className="d-flex flex-wrap gap-3 mt-3">
                        {Object.entries(SECTOR_COLORS).map(([sector, colors]) => (
                            <div key={sector} className="d-flex align-items-center gap-1">
                                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: colors.free }} />
                                <small className="text-muted">{sector}</small>
                            </div>
                        ))}
                        <div className="d-flex align-items-center gap-1">
                            <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#f97316' }} />
                            <small className="text-muted">Izabrano</small>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#e5e7eb', border: '1px solid #ccc' }} />
                            <small className="text-muted">Zauzeto</small>
                        </div>
                    </div>
                </Col>

                {/* PANEL DESNO */}
                <Col lg={3}>
                    <Card className="shadow-sm border-0 p-3 sticky-top" style={{ top: 20 }}>
                        <h6 className="mb-3 d-flex align-items-center gap-2">
                            <FaTicketAlt /> Izabrana sedišta
                            {selected.size > 0 && (
                                <Badge bg="primary">{selected.size}</Badge>
                            )}
                        </h6>

                        {selectedSeats.length === 0 ? (
                            <p className="text-muted small">Kliknite na slobodno sedište na mapi.</p>
                        ) : (
                            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {selectedSeats.map((s) => (
                                    <div
                                        key={s._id}
                                        className="d-flex justify-content-between align-items-center py-1 border-bottom"
                                    >
                                        <div>
                                            <div className="small fw-bold">
                                                {s.sector} — Red {s.row}, Mesto {s.seatNumber}
                                            </div>
                                            <div className="small text-muted">{s.ticketTypeName}</div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="small fw-bold" style={{ color: '#ff940a' }}>
                                                {s.price} RSD
                                            </span>
                                            <button
                                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => toggleSeat(s)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <hr />
                        <div className="d-flex justify-content-between mb-3">
                            <span className="fw-bold">Ukupno</span>
                            <span className="fw-bold" style={{ color: '#ff940a' }}>
                                {totalPrice.toFixed(2)} RSD
                            </span>
                        </div>

                        <div className="d-grid">
                            <Button
                                variant="primary"
                                disabled={selected.size === 0}
                                onClick={handleAddToCart}
                            >
                                <FaTicketAlt className="me-2" />
                                Dodaj u korpu
                            </Button>
                        </div>

                        {selected.size > 0 && (
                            <Button
                                variant="link"
                                className="mt-2 text-danger small p-0"
                                onClick={() => setSelected(new Set())}
                            >
                                Poništi izbor
                            </Button>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SeatMapScreen;