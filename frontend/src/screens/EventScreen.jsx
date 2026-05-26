import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaClock,
    FaTicketAlt,
    FaArrowLeft,
    FaMinus,
    FaPlus,
    FaChair,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { useGetEventDetailsQuery } from '../slices/eventsApiSlice';
import { addToCart } from '../slices/cartSlice';

const EventScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);

    const { data: event, isLoading, error } = useGetEventDetailsQuery(id);
    const [quantities, setQuantities] = useState({});

    const handleQtyChange = (ticketTypeId, delta, max) => {
        setQuantities((prev) => {
            const current = prev[ticketTypeId] || 0;
            const next = Math.max(0, Math.min(max, current + delta));
            return { ...prev, [ticketTypeId]: next };
        });
    };

    const handleAddToCart = () => {
        if (!userInfo) {
            toast.info('Morate biti prijavljeni');
            navigate('/login');
            return;
        }
        const selected = event.ticketTypes.filter((t) => (quantities[t._id] || 0) > 0);
        if (selected.length === 0) {
            toast.warning('Izaberite karte');
            return;
        }
        selected.forEach((t) => {
            dispatch(addToCart({
                eventId: event._id,
                eventName: event.name,
                eventDate: event.date,
                eventVenue: event.venue ? `${event.venue.name}, ${event.venue.city}` : '',
                eventImage: event.image,
                ticketTypeId: t._id,
                ticketType: t.name,
                price: t.price,
                quantity: quantities[t._id],
            }));
        });
        toast.success('Dodato u korpu!');
        navigate('/cart');
    };

    const handleChooseSeats = () => {
        if (!userInfo) {
            toast.info('Morate biti prijavljeni');
            navigate(`/login?redirect=/events/${id}/seats`);
            return;
        }
        navigate(`/events/${id}/seats`);
    };

    if (isLoading) return <Loader />;
    if (error) return (
        <Container className="py-5">
            <Message variant="danger">{error?.data?.message || 'Greška pri učitavanju'}</Message>
        </Container>
    );

    const formattedDate = new Date(event.date).toLocaleDateString('sr-Latn-RS', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
    const totalPrice = event.ticketTypes?.reduce((a, t) => a + (quantities[t._id] || 0) * t.price, 0) || 0;

    return (
        <Container className="py-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" /> Nazad
            </Button>

            <Row className="g-4">
                <Col lg={7}>
                    <Card className="mb-4 overflow-hidden">
                        <img
                            src={event.image}
                            alt={event.name}
                            style={{ height: '350px', objectFit: 'cover' }}
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/800x400')}
                        />
                    </Card>

                    <Card className="mb-4 p-3">
                        <h3 className="mb-2">{event.name}</h3>
                        <p className="text-muted mb-3">{event.description}</p>
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex align-items-center gap-2">
                                <FaCalendarAlt /><span>{formattedDate}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <FaClock /><span>{event.time}h</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <FaMapMarkerAlt />
                                <span>{event.venue?.name}, {event.venue?.city}</span>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="p-3 sticky-top" style={{ top: '20px' }}>
                        <h5 className="mb-3">
                            <FaTicketAlt className="me-2" />
                            Izaberi karte
                        </h5>

                        {event.hasSeatMap ? (
                            <>
                                <p className="text-muted small mb-3">
                                    Ovaj događaj ima numerisana sedišta. Izaberite željeno mesto u dvorani.
                                </p>
                                <Button
                                    variant="primary"
                                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleChooseSeats}
                                >
                                    <FaChair />
                                    Izaberi sedište u dvorani
                                </Button>
                            </>
                        ) : (
                            <>
                                {event.ticketTypes?.length > 0 ? (
                                    event.ticketTypes.map((t) => (
                                        <div
                                            key={t._id}
                                            className="d-flex justify-content-between align-items-center border-bottom py-2"
                                        >
                                            <div>
                                                <div className="fw-bold">{t.name}</div>
                                                <div className="text-success fw-bold">{t.price} RSD</div>
                                                <small className="text-muted">{t.availableQuantity} dostupno</small>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    onClick={() => handleQtyChange(t._id, -1, t.availableQuantity)}
                                                    disabled={!quantities[t._id]}
                                                >
                                                    <FaMinus />
                                                </Button>
                                                <span>{quantities[t._id] || 0}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    onClick={() => handleQtyChange(t._id, 1, t.availableQuantity)}
                                                    disabled={t.availableQuantity === 0}
                                                >
                                                    <FaPlus />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Message>Nema karata</Message>
                                )}
                                <hr />
                                <div className="d-flex justify-content-between mb-3">
                                    <span>Ukupno ({totalSelected})</span>
                                    <strong>{totalPrice} RSD</strong>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-100"
                                    disabled={totalSelected === 0}
                                    onClick={handleAddToCart}
                                >
                                    <FaTicketAlt className="me-2" />
                                    Dodaj u korpu
                                </Button>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default EventScreen;