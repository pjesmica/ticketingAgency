import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Badge, Alert, Button, Table } from 'react-bootstrap';
import {
    FaArrowLeft, FaCheckCircle, FaTimesCircle, FaTicketAlt,
    FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUser, FaEnvelope, FaCreditCard,
} from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { useGetOrderDetailsQuery } from '../../slices/ordersApiSlice';

const AdminOrderScreen = () => {
    const { id: orderId } = useParams();
    const navigate = useNavigate();

    const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('sr-Latn-RS', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) return <Loader />;
    if (error) return <Message variant='danger'>{error?.data?.message || error.error}</Message>;
    if (!order) return null;

    const totalItems = order.orderItems.reduce((a, i) => a + i.quantity, 0);

    return (
        <div className='py-2'>
            <Button
                variant='outline-secondary'
                size='sm'
                className='mb-3'
                onClick={() => navigate('/admin/orders')}
            >
                <FaArrowLeft className='me-2' />
                Nazad na narudžbine
            </Button>

            <Row className='align-items-center mb-4'>
                <Col>
                    <h1 className='fw-bold mb-0'>
                        Narudžbina <code className='fs-5'>#{order._id.slice(-8).toUpperCase()}</code>
                    </h1>
                    <p className='text-muted mt-1 mb-0'>
                        Kreirana: {formatDate(order.createdAt)}
                    </p>
                </Col>
                <Col xs='auto'>
                    {order.isPaid ? (
                        <Badge bg='success' className='px-3 py-2'>
                            <FaCheckCircle className='me-1' />
                            Plaćeno
                        </Badge>
                    ) : (
                        <Badge bg='warning' text='dark' className='px-3 py-2'>
                            <FaTimesCircle className='me-1' />
                            Neplaćeno
                        </Badge>
                    )}
                </Col>
            </Row>

            <Row className='g-4'>
                {/* ── Leva kolona ── */}
                <Col lg={7}>
                    {/* Kupac */}
                    <Card className='border-0 shadow-sm mb-3'>
                        <Card.Header className='bg-white border-bottom py-3 fw-semibold'>
                            <FaUser className='me-2 text-success' />
                            Kupac
                        </Card.Header>
                        <Card.Body>
                            <div className='mb-1'>
                                <strong>{order.user?.name || 'N/A'}</strong>
                            </div>
                            <div className='text-muted small'>
                                <FaEnvelope className='me-1' />
                                {order.user?.email || 'N/A'}
                            </div>
                            <div className='text-muted small mt-1'>
                                ID korisnika: <code>{order.user?._id || '-'}</code>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Karte */}
                    <Card className='border-0 shadow-sm mb-3'>
                        <Card.Header className='bg-white border-bottom py-3 fw-semibold'>
                            <FaTicketAlt className='me-2 text-success' />
                            Karte ({totalItems})
                        </Card.Header>
                        <Card.Body className='p-0'>
                            {order.orderItems.map((item, i) => (
                                <div key={i} className='p-3 border-bottom'>
                                    <div className='d-flex justify-content-between align-items-start gap-2'>
                                        <div>
                                            <div className='fw-bold'>{item.eventName}</div>
                                            <div className='text-muted small d-flex flex-wrap gap-3 mt-1'>
                                                {item.eventDate && (
                                                    <span>
                                                        <FaCalendarAlt className='me-1' />
                                                        {new Date(item.eventDate).toLocaleDateString('sr-Latn-RS', {
                                                            day: 'numeric', month: 'long', year: 'numeric',
                                                        })}
                                                    </span>
                                                )}
                                                {item.eventVenue && (
                                                    <span>
                                                        <FaMapMarkerAlt className='me-1' />
                                                        {item.eventVenue}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='d-flex align-items-center gap-2 mt-2 flex-wrap'>
                                                <Badge bg='light' text='dark' className='border'>
                                                    {item.ticketType}
                                                </Badge>
                                                <span className='text-muted small'>× {item.quantity}</span>
                                            </div>
                                            {item.seats?.length > 0 && (
                                                item.seats[0]?.row?.startsWith('GA-') ? (
                                                    item.seats[0]?.sector && (
                                                        <div className='mt-2'>
                                                            <Badge bg='light' text='dark' className='border'>
                                                                Zona: {item.seats[0].sector}
                                                            </Badge>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className='mt-2 d-flex flex-wrap gap-1'>
                                                        {item.seats.map((s, j) => (
                                                            <Badge
                                                                key={j}
                                                                bg='light'
                                                                text='dark'
                                                                className='border font-monospace'
                                                                style={{ fontSize: 10 }}
                                                            >
                                                                {s.sector ? `${s.sector} ` : ''}{s.row}{s.seatNumber}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <div className='text-end flex-shrink-0'>
                                            <div className='fw-bold text-success'>
                                                {(item.price * item.quantity).toLocaleString('sr-RS')} RSD
                                            </div>
                                            <div className='text-muted small'>
                                                {item.price.toLocaleString('sr-RS')} / kom
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Desna kolona ── */}
                <Col lg={5}>
                    <Card className='border-0 shadow-sm mb-3'>
                        <Card.Header className='bg-white border-bottom py-3 fw-semibold'>
                            <FaCreditCard className='me-2 text-success' />
                            Plaćanje
                        </Card.Header>
                        <Card.Body>
                            <Table borderless size='sm' className='mb-0'>
                                <tbody>
                                    <tr>
                                        <td className='text-muted'>Način plaćanja</td>
                                        <td className='text-end fw-semibold'>{order.paymentMethod}</td>
                                    </tr>
                                    <tr>
                                        <td className='text-muted'>Status</td>
                                        <td className='text-end'>
                                            {order.isPaid ? (
                                                <Badge bg='success'>Plaćeno</Badge>
                                            ) : (
                                                <Badge bg='warning' text='dark'>Čeka uplatu</Badge>
                                            )}
                                        </td>
                                    </tr>
                                    {order.isPaid && order.paidAt && (
                                        <tr>
                                            <td className='text-muted'>
                                                <FaClock className='me-1' />
                                                Plaćeno u
                                            </td>
                                            <td className='text-end small'>{formatDate(order.paidAt)}</td>
                                        </tr>
                                    )}
                                    {order.paymentResult?.id && (
                                        <tr>
                                            <td className='text-muted'>Transakcija</td>
                                            <td className='text-end small'>
                                                <code>{order.paymentResult.id}</code>
                                            </td>
                                        </tr>
                                    )}
                                    {order.paymentResult?.email_address && (
                                        <tr>
                                            <td className='text-muted'>PayPal email</td>
                                            <td className='text-end small'>{order.paymentResult.email_address}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            <hr />

                            <div className='d-flex justify-content-between fw-bold fs-5'>
                                <span>Ukupno</span>
                                <span className='text-success'>
                                    {order.totalPrice.toLocaleString('sr-RS')} RSD
                                </span>
                            </div>

                            {!order.isPaid && (
                                <Alert variant='warning' className='mt-3 small mb-0'>
                                    Ova narudžbina još uvek nije plaćena od strane korisnika.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminOrderScreen;