import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Button, Badge, Image, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaCreditCard, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CheckoutSteps from '../components/CheckoutSteps';
import { useCreateOrderMutation } from '../slices/ordersApiSlice';
import { clearCart } from '../slices/cartSlice';

const PlaceOrderScreen = () => {
    const navigate  = useNavigate();
    const dispatch  = useDispatch();
    const { cartItems } = useSelector(s => s.cart);

    const [createOrder, { isLoading }] = useCreateOrderMutation();

    const totalPrice = cartItems.reduce((a, i) => a + i.price * i.quantity, 0);
    const totalItems = cartItems.reduce((a, i) => a + i.quantity, 0);

    const handlePlaceOrder = async () => {
        try {
            const res = await createOrder({
                orderItems: cartItems,
                paymentMethod: 'PayPal',
                totalPrice,
            }).unwrap();

            // Navigiraj PRVO, pa onda briši korpu da useEffect ne redirectuje na /
            navigate(`/orders/${res._id}`);
            dispatch(clearCart());
        } catch (err) {
            toast.error(err?.data?.message || 'Greška pri kreiranju narudžbine');
        }
    };

    return (
        <div className="py-4">
            <CheckoutSteps currentStep={2} />

            <div className="d-flex align-items-center gap-3 mb-4">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/cart')}>
                    <FaArrowLeft />
                </Button>
                <div>
                    <h3 className="fw-bold mb-0">Pregled narudžbine</h3>
                    <p className="text-muted small mb-0">Proverite pre nego što nastavite na plaćanje</p>
                </div>
            </div>

            <Row className="g-4">
                {/* ── Leva kolona — stavke ── */}
                <Col lg={8}>
                    {cartItems.map((item, idx) => (
                        <Card key={idx} className="mb-3 border-0 shadow-sm">
                            <Card.Body className="p-3">
                                <div className="d-flex gap-3 align-items-start">
                                    <Image
                                        src={item.eventImage}
                                        alt={item.eventName}
                                        rounded
                                        style={{ width: 90, height: 65, objectFit: 'cover', flexShrink: 0 }}
                                        onError={e => (e.target.src = 'https://placehold.co/90x65/e9ecef/6c757d?text=Event')}
                                    />
                                    <div className="flex-grow-1">
                                        <div className="fw-bold fs-6">{item.eventName}</div>
                                        <div className="text-muted small d-flex flex-wrap gap-3 mt-1">
                                            {item.eventDate && (
                                                <span>
                                                    <FaCalendarAlt className="me-1" />
                                                    {new Date(item.eventDate).toLocaleDateString('sr-Latn-RS', {
                                                        day: 'numeric', month: 'long', year: 'numeric',
                                                    })}
                                                </span>
                                            )}
                                            {item.eventVenue && (
                                                <span>
                                                    <FaMapMarkerAlt className="me-1" />
                                                    {item.eventVenue}
                                                </span>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                                            <Badge bg="light" text="dark" className="border">
                                                <FaTicketAlt className="me-1" />
                                                {item.ticketType}
                                            </Badge>
                                            <span className="text-muted small">× {item.quantity}</span>
                                        </div>

                                        {/* Sedišta ako postoje */}
                                        {item.seats?.length > 0 && (
                                            <div className="mt-2 d-flex flex-wrap gap-1">
                                                {item.seats.map((s, i) => (
                                                    <Badge key={i} bg="light" text="dark" className="border font-monospace" style={{ fontSize: 10 }}>
                                                        {s.sector ? `${s.sector} ` : ''}{s.row}{s.seatNumber}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-end flex-shrink-0">
                                        <div className="fw-bold text-success fs-6">
                                            {(item.price * item.quantity).toLocaleString('sr-RS')} RSD
                                        </div>
                                        <div className="text-muted small">
                                            {item.price.toLocaleString('sr-RS')} × {item.quantity}
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>

                {/* ── Desna kolona — rezime + dugme ── */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm sticky-top" style={{ top: 20, zIndex: 10 }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Rezime narudžbine</h5>

                            <div className="d-flex justify-content-between text-muted mb-2">
                                <span>Karte ({totalItems})</span>
                                <span>{totalPrice.toLocaleString('sr-RS')} RSD</span>
                            </div>

                            <div className="d-flex justify-content-between text-muted mb-3">
                                <span>Naknada za servis</span>
                                <span className="text-success">Besplatno</span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between mb-4">
                                <span className="fw-bold fs-5">Ukupno</span>
                                <span className="fw-bold fs-5 text-success">
                                    {totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            <Alert variant="info" className="small py-2 mb-3">
                                <FaCreditCard className="me-2" />
                                Plaćanje putem <strong>PayPal</strong> — kreditna kartica ili PayPal nalog
                            </Alert>

                            <Button
                                variant="success"
                                size="lg"
                                className="w-100"
                                onClick={handlePlaceOrder}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <><Spinner size="sm" className="me-2" />Kreiranje narudžbine...</>
                                ) : (
                                    <><FaCreditCard className="me-2" />Nastavi na plaćanje</>
                                )}
                            </Button>

                            <p className="text-muted small text-center mt-2 mb-0">
                                Kliknom prihvatate naše uslove korišćenja
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PlaceOrderScreen;