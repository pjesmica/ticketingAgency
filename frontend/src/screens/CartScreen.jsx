import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { FaTrash, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateCartQty } from '../slices/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';
import Message from '../components/Message';

const CartScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);
    const { userInfo }  = useSelector((state) => state.auth);

    const totalItems = cartItems.reduce((a, c) => a + c.quantity, 0);
    const totalPrice = cartItems.reduce((a, c) => a + c.price * c.quantity, 0);

    const handleCheckout = () => {
        if (!userInfo) {
            navigate('/login?redirect=/placeorder');
        } else {
            navigate('/placeorder');
        }
    };

    const handleQty = (item, qty) => {
        if (qty < 1) return;
        dispatch(updateCartQty({
            eventId: item.eventId,
            ticketTypeId: item.ticketTypeId,
            quantity: qty
        }));
    };

    const handleRemove = (item) => {
        dispatch(removeFromCart({
            eventId: item.eventId,
            ticketTypeId: item.ticketTypeId
        }));
    };

    return (
        <Container className="py-4">

            <CheckoutSteps currentStep={1} />

            <h2 className="fw-bold mb-4">
                <FaShoppingCart className="me-2 text-success" />
                Korpa
            </h2>

            {cartItems.length === 0 ? (
                <div className="text-center py-5">
                    <div style={{ fontSize: '4rem' }}>🎫</div>
                    <h4 className="text-muted">Korpa je prazna</h4>
                    <p className="text-muted">
                        Dodajte karte sa događaja
                    </p>

                    <Button
                        variant="success"
                        onClick={() => navigate('/')}
                    >
                        Pregledaj događaje
                    </Button>
                </div>
            ) : (
                <Row className="g-4">

                    {/* LEFT */}
                    <Col lg={8}>

                        {cartItems.map((item) => (
                            <Card
                                key={`${item.eventId}-${item.ticketTypeId}`}
                                className="mb-3 p-3"
                            >
                                <div className="d-flex align-items-center gap-3">

                                    {/* INFO */}
                                    <div className="flex-grow-1">
                                        <div className="fw-bold">
                                            {item.eventName}
                                        </div>

                                        <div className="text-muted small">
                                            {item.ticketType} · {item.eventVenue}
                                        </div>

                                        <div className="text-success fw-bold">
                                            {item.price.toLocaleString('sr-RS')} RSD
                                        </div>
                                    </div>

                                    {/* QTY */}
                                    <div className="d-flex align-items-center gap-2">

                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() =>
                                                handleQty(
                                                    item,
                                                    item.quantity - 1
                                                )
                                            }
                                            disabled={item.quantity <= 1}
                                        >
                                            –
                                        </Button>

                                        <span className="fw-bold">
                                            {item.quantity}
                                        </span>

                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() =>
                                                handleQty(
                                                    item,
                                                    item.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </Button>

                                    </div>

                                    {/* TOTAL */}
                                    <div
                                        className="fw-bold text-end"
                                        style={{ minWidth: 100 }}
                                    >
                                        {(item.price * item.quantity).toLocaleString('sr-RS')} RSD
                                    </div>

                                    {/* REMOVE */}
                                    <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => handleRemove(item)}
                                    >
                                        <FaTrash />
                                    </Button>

                                </div>
                            </Card>
                        ))}

                    </Col>

                    {/* RIGHT */}
                    <Col lg={4}>

                        <Card className="p-3 sticky-top" style={{ top: '20px' }}>

                            <h5 className="fw-bold mb-3">
                                Pregled narudžbine
                            </h5>

                            <div className="d-flex justify-content-between text-muted mb-2">
                                <span>Karte ({totalItems})</span>
                                <span>
                                    {totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between mb-3">
                                <span className="fw-bold">Ukupno</span>
                                <span className="fw-bold fs-5 text-success">
                                    {totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            <Button
                                variant="success"
                                className="w-100 d-flex align-items-center justify-content-center gap-2"
                                onClick={handleCheckout}
                            >
                                Nastavi
                                <FaArrowRight />
                            </Button>

                        </Card>

                    </Col>

                </Row>
            )}

        </Container>
    );
};

export default CartScreen;