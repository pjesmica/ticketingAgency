import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import {
    FaCheckCircle, FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt,
    FaClock, FaCreditCard, FaHome,
} from 'react-icons/fa';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { toast } from 'react-toastify';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import Message from '../components/Message';
import CountdownTimer from '../components/CountdownTimer';
import { useGetOrderDetailsQuery, usePayOrderMutation, useGetPayPalClientIdQuery, useConfirmFreeOrderMutation } from '../slices/ordersApiSlice';

const OrderScreen = () => {
    const { id: orderId } = useParams();
    const navigate        = useNavigate();
    const { userInfo }    = useSelector(s => s.auth);

    const { data: order, refetch, isLoading, error } = useGetOrderDetailsQuery(orderId);
    const [payOrder, { isLoading: loadingPay }] = usePayOrderMutation();
    const [confirmFreeOrder, { isLoading: loadingFree }] = useConfirmFreeOrderMutation();
    const { data: paypal, isLoading: loadingPayPal, error: errorPayPal } = useGetPayPalClientIdQuery(undefined, {
        skip: order?.totalPrice === 0, // Ne treba PayPal za besplatne narudžbine
    });
    const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

    // Učitaj PayPal script kad je narudžbina neplaćena
    useEffect(() => {
        if (!errorPayPal && !loadingPayPal && paypal?.clientId && order && !order.isPaid) {
            paypalDispatch({
                type: 'resetOptions',
                value: { 'client-id': paypal.clientId, currency: 'EUR' },
            });
            paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
        }
    }, [errorPayPal, loadingPayPal, paypal, order, paypalDispatch]);

    // PayPal callbacks
    const createPayPalOrder = (data, actions) => {
        // Konvertuj RSD u EUR (okvirni kurs — u produkciji uzmi pravi kurs)
        const totalEur = Math.max(0.01, (order.totalPrice / 117).toFixed(2));
        return actions.order.create({
            purchase_units: [{
                description: `Karte — ${order.orderItems.map(i => i.eventName).join(', ')}`,
                amount: { value: String(totalEur) },
            }],
        });
    };

    const onPayPalApprove = (data, actions) =>
        actions.order.capture().then(async details => {
            try {
                await payOrder({ orderId, details }).unwrap();
                refetch();
                toast.success('Plaćanje uspešno! Karte su rezervisane. 🎉');
            } catch (err) {
                toast.error(err?.data?.message || 'Greška pri obradi plaćanja');
            }
        });

    const onPayPalError = err => {
        toast.error(err?.message || 'PayPal greška');
    };

    if (isLoading) return <Loader />;
    if (error) return <Message variant="danger">{error?.data?.message || 'Greška pri učitavanju'}</Message>;

    const totalItems = order.orderItems.reduce((a, i) => a + i.quantity, 0);
    const currentStep = order.isPaid ? 4 : 3;

    return (
        <div className="py-4">
            <CheckoutSteps currentStep={currentStep} />

            {/* ── Header ── */}
            {order.isPaid ? (
                <div className="text-center mb-5">
                    <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
                    <h2 className="fw-bold text-success">Plaćanje uspešno!</h2>
                    <p className="text-muted">
                        Hvala na kupovini! Vaše karte su rezervisane.
                    </p>
                    <Button variant="outline-success" onClick={() => navigate('/myorders')}>
                        <FaTicketAlt className="me-2" />
                        Moje karte
                    </Button>
                    <Button variant="outline-secondary" className="ms-2" onClick={() => navigate('/')}>
                        <FaHome className="me-2" />
                        Početna
                    </Button>
                </div>
            ) : (
                <div className="mb-4">
                    <h3 className="fw-bold">Plaćanje</h3>
                    <p className="text-muted small mb-0">
                        Narudžbina #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <Alert variant="warning" className="d-inline-flex align-items-center gap-2 mt-2 py-2 px-3 mb-0">
                        <FaClock />
                        <span>
                            Sedišta su rezervisana još:{' '}
                            <CountdownTimer expiresAt={order.expiresAt} className="fw-bold font-monospace" />
                        </span>
                    </Alert>
                </div>
            )}

            <Row className="g-4">
                {/* ── Leva kolona — detalji narudžbine ── */}
                <Col lg={7}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Header className="bg-white border-bottom py-3 fw-semibold">
                            <FaTicketAlt className="me-2 text-success" />
                            Karte ({totalItems})
                        </Card.Header>
                        <Card.Body className="p-0">
                            {order.orderItems.map((item, i) => (
                                <div key={i} className="p-3 border-bottom">
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                            <div className="fw-bold">{item.eventName}</div>
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
                                                    {item.ticketType}
                                                </Badge>
                                                <span className="text-muted small">× {item.quantity}</span>
                                            </div>
                                            {/* Sedišta — za GA/standing zone prikaži samo naziv zone */}
                                            {item.seats?.length > 0 && (
                                                item.seats[0]?.row?.startsWith('GA-') ? (
                                                    item.seats[0]?.sector && (
                                                        <div className="mt-2">
                                                            <Badge bg="light" text="dark" className="border">
                                                                Zona: {item.seats[0].sector}
                                                            </Badge>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="mt-2 d-flex flex-wrap gap-1">
                                                        {item.seats.map((s, j) => (
                                                            <Badge key={j} bg="light" text="dark" className="border font-monospace" style={{ fontSize: 10 }}>
                                                                {s.sector ? `${s.sector} ` : ''}{s.row}{s.seatNumber}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <div className="text-end flex-shrink-0">
                                            <div className="fw-bold text-success">
                                                {(item.price * item.quantity).toLocaleString('sr-RS')} RSD
                                            </div>
                                            <div className="text-muted small">
                                                {item.price.toLocaleString('sr-RS')} / kom
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>

                    {/* Status plaćanja */}
                    {order.isPaid && (
                        <Alert variant="success" className="d-flex align-items-center gap-2">
                            <FaCheckCircle style={{ fontSize: 20, flexShrink: 0 }} />
                            <div>
                                <strong>Plaćeno</strong>
                                {order.paidAt && (
                                    <div className="small">
                                        <FaClock className="me-1" />
                                        {new Date(order.paidAt).toLocaleString('sr-Latn-RS')}
                                    </div>
                                )}
                                {order.paymentResult?.email_address && (
                                    <div className="small text-muted">
                                        PayPal: {order.paymentResult.email_address}
                                    </div>
                                )}
                            </div>
                        </Alert>
                    )}
                </Col>

                {/* ── Desna kolona — summary + PayPal ── */}
                <Col lg={5}>
                    <Card className="border-0 shadow-sm sticky-top" style={{ top: 20, zIndex: 10 }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Ukupno za plaćanje</h5>

                            {order.orderItems.map((item, i) => (
                                <div key={i} className="d-flex justify-content-between text-muted small mb-1">
                                    <span>{item.eventName} ({item.ticketType}) × {item.quantity}</span>
                                    <span>{(item.price * item.quantity).toLocaleString('sr-RS')} RSD</span>
                                </div>
                            ))}

                            <hr />

                            <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                                <span>Ukupno</span>
                                <span className="text-success">
                                    {order.totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            {/* ── PLAĆANJE ── */}
                            {!order.isPaid && (
                                <>
                                    {order.totalPrice === 0 ? (
                                        /* Besplatna karta — jedno dugme, bez PayPal-a */
                                        <div className="text-center">
                                            <Alert variant="success" className="py-2 mb-3 small">
                                                🎟️ Ova karta je <strong>besplatna</strong> — klikni da potvrdiš rezervaciju.
                                            </Alert>
                                            {loadingFree && <Loader />}
                                            <Button
                                                variant="success"
                                                size="lg"
                                                className="w-100"
                                                disabled={loadingFree}
                                                onClick={async () => {
                                                    try {
                                                        await confirmFreeOrder(orderId).unwrap();
                                                        refetch();
                                                        toast.success('Karta uspešno rezervisana! 🎉');
                                                    } catch (err) {
                                                        toast.error(err?.data?.message || 'Greška');
                                                    }
                                                }}
                                            >
                                                {loadingFree
                                                    ? <><Spinner size="sm" className="me-2" />Rezervacija...</>
                                                    : <><FaCheckCircle className="me-2" />Potvrdi besplatnu kartu</>
                                                }
                                            </Button>
                                        </div>
                                    ) : (
                                        /* Plaćanje putem PayPal-a */
                                        <>
                                            <Alert variant="light" className="border small py-2 mb-3">
                                                <FaCreditCard className="me-1 text-primary" />
                                                Plaćanje putem PayPal-a — sigurno i brzo
                                            </Alert>

                                            {loadingPay && <Loader />}

                                            {isPending || loadingPayPal ? (
                                                <div className="text-center py-3">
                                                    <Spinner animation="border" variant="primary" />
                                                    <p className="text-muted small mt-2">Učitavanje PayPal-a...</p>
                                                </div>
                                            ) : (
                                                <PayPalButtons
                                                    style={{ layout: 'vertical', shape: 'rect', color: 'gold' }}
                                                    createOrder={createPayPalOrder}
                                                    onApprove={onPayPalApprove}
                                                    onError={onPayPalError}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {order.isPaid && (
                                <div className="text-center">
                                    <FaCheckCircle style={{ color: '#10b981', fontSize: 48, marginBottom: 8 }} />
                                    <p className="fw-bold text-success mb-3">Narudžbina plaćena!</p>
                                    <Button variant="success" className="w-100 mb-2" onClick={() => navigate('/myorders')}>
                                        <FaTicketAlt className="me-2" />
                                        Pogledaj moje karte
                                    </Button>
                                    <Button variant="outline-secondary" className="w-100" onClick={() => navigate('/')}>
                                        <FaHome className="me-2" />
                                        Nazad na početnu
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OrderScreen;