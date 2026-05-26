import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaTicketAlt, FaPaypal, FaArrowRight } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { useCreateOrderMutation } from '../slices/ordersApiSlice';
import { clearCart } from '../slices/cartSlice';

const PlaceOrderScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { cartItems } = useSelector((state) => state.cart);

    const [createOrder, { isLoading, error }] = useCreateOrderMutation();

    const totalPrice = cartItems.reduce(
        (a, c) => a + c.price * c.quantity,
        0
    );

    useEffect(() => {
        if (cartItems.length === 0) navigate('/cart');
    }, [cartItems, navigate]);

    const handlePlaceOrder = async () => {
        try {
            const order = await createOrder({
                orderItems: cartItems,
                paymentMethod: 'PayPal',
            }).unwrap();

            dispatch(clearCart());
            navigate(`/order/${order._id}`);
        } catch (err) {
            toast.error(
                err?.data?.message || err.error || 'Greška pri narudžbini'
            );
        }
    };

    return (
        <Container className="py-4">

            <CheckoutSteps currentStep={2} />

            <h2 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <FaTicketAlt className="text-success" />
                Pregled narudžbine
            </h2>

            <Row className="g-4">

                {/* LEFT */}
                <Col lg={8}>

                    {/* ITEMS */}
                    <Card className="mb-3 shadow-sm border-0">
                        <Card.Body>

                            <h5 className="fw-bold mb-3">
                                Karte
                            </h5>

                            {cartItems.map((item) => (
                                <div
                                    key={`${item.eventId}-${item.ticketTypeId}`}
                                    className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom"
                                >

                                    <Image
                                        src={item.eventImage}
                                        style={{
                                            width: 60,
                                            height: 45,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                        }}
                                        onError={(e) =>
                                            (e.target.src =
                                                'https://via.placeholder.com/60x45')
                                        }
                                    />

                                    <div className="flex-grow-1">
                                        <div className="fw-bold">
                                            {item.eventName}
                                        </div>
                                        <div className="text-muted small">
                                            {item.ticketType} × {item.quantity}
                                        </div>
                                    </div>

                                    <div className="fw-bold">
                                        {(item.price * item.quantity).toLocaleString(
                                            'sr-RS'
                                        )}{' '}
                                        RSD
                                    </div>

                                </div>
                            ))}

                        </Card.Body>
                    </Card>

                    {/* PAYMENT */}
                    <Card className="shadow-sm border-0">
                        <Card.Body className="d-flex align-items-center gap-3">

                            <FaPaypal
                                style={{
                                    color: '#003087',
                                    fontSize: '1.5rem',
                                }}
                            />

                            <div>
                                <div className="fw-bold">
                                    PayPal plaćanje
                                </div>
                                <div className="text-muted small">
                                    Bićete preusmereni na PayPal
                                </div>
                            </div>

                        </Card.Body>
                    </Card>

                </Col>

                {/* RIGHT */}
                <Col lg={4}>

                    <Card className="shadow-sm border-0 sticky-top" style={{ top: 20 }}>

                        <Card.Body>

                            <h5 className="fw-bold mb-3">
                                Sažetak
                            </h5>

                            <div className="d-flex justify-content-between text-muted mb-2">
                                <span>Karte</span>
                                <span>
                                    {totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            <div className="d-flex justify-content-between text-muted mb-2">
                                <span>Naknada</span>
                                <span>0 RSD</span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between fw-bold mb-3">
                                <span>Ukupno</span>
                                <span className="fs-5 text-success">
                                    {totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            {error && (
                                <Message variant="danger">
                                    {error?.data?.message || error.error}
                                </Message>
                            )}

                            <Button
                                variant="success"
                                className="w-100 d-flex align-items-center justify-content-center gap-2"
                                onClick={handlePlaceOrder}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    'Obrada...'
                                ) : (
                                    <>
                                        Potvrdi narudžbinu
                                        <FaArrowRight />
                                    </>
                                )}
                            </Button>

                            {isLoading && <Loader />}

                        </Card.Body>

                    </Card>

                </Col>

            </Row>

        </Container>
    );
};

export default PlaceOrderScreen;