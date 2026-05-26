import { Badge, Card, Col, Row, Accordion, Table } from 'react-bootstrap';
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

const MyOrdersScreen = () => {
    const { data: orders, isLoading, error } = useGetMyOrdersQuery();

    if (isLoading) return <Loader />;
    if (error) return <Message variant="danger">Greška pri učitavanju narudžbina</Message>;

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-5">
                <FaTicketAlt style={{ fontSize: '3rem', color: '#ccc' }} />
                <h4 className="mt-3 text-muted">Još uvek nemate kupljenih karata</h4>
                <a href="/" className="btn btn-primary mt-3">Pogledaj događaje</a>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex align-items-center gap-2 mb-4">
                <FaTicketAlt style={{ color: '#ff940a', fontSize: '1.4rem' }} />
                <h3 className="mb-0">Moje karte</h3>
                <Badge bg="secondary" className="ms-1">{orders.length}</Badge>
            </div>

            <Accordion defaultActiveKey="0" className="d-flex flex-column gap-3">
                {orders.map((order, idx) => {
                    const totalQty = order.orderItems.reduce((a, i) => a + i.quantity, 0);

                    return (
                        <Accordion.Item
                            key={order._id}
                            eventKey={String(idx)}
                            className="border-0 shadow-sm"
                            style={{ borderRadius: '10px', overflow: 'hidden' }}
                        >
                            <Accordion.Header>
                                <Row className="w-100 align-items-center g-2 pe-3">
                                    <Col xs={12} sm={5}>
                                        <span className="fw-bold">
                                            {order.orderItems[0]?.eventName}
                                        </span>
                                        {order.orderItems.length > 1 && (
                                            <span className="text-muted fw-normal small ms-1">
                                                (+{order.orderItems.length - 1} događaja)
                                            </span>
                                        )}
                                    </Col>
                                    <Col xs={6} sm={3} className="text-muted small">
                                        <FaCalendarAlt className="me-1" />
                                        {new Date(order.createdAt).toLocaleDateString('sr-Latn-RS')}
                                    </Col>
                                    <Col xs={6} sm={2} className="small">
                                        <span className="fw-bold">{order.totalPrice.toFixed(2)} RSD</span>
                                    </Col>
                                    <Col xs={12} sm={2} className="d-flex gap-2">
                                        <Badge bg={order.isPaid ? 'success' : 'warning'} text={order.isPaid ? 'white' : 'dark'}>
                                            {order.isPaid ? 'Plaćeno' : 'Na čekanju'}
                                        </Badge>
                                        <Badge bg="light" text="dark" className="border">
                                            {totalQty} {totalQty === 1 ? 'karta' : totalQty < 5 ? 'karte' : 'karata'}
                                        </Badge>
                                    </Col>
                                </Row>
                            </Accordion.Header>

                            <Accordion.Body className="bg-white p-0">
                                {/* Detalji karata */}
                                {order.orderItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-3 border-bottom d-flex flex-column flex-sm-row justify-content-between gap-2"
                                    >
                                        <div>
                                            <div className="fw-bold">{item.eventName}</div>
                                            <div className="text-muted small d-flex flex-wrap gap-3 mt-1">
                                                <span>
                                                    <FaCalendarAlt className="me-1" />
                                                    {new Date(item.eventDate).toLocaleDateString('sr-Latn-RS')}
                                                </span>
                                                <span>
                                                    <FaMapMarkerAlt className="me-1" />
                                                    {item.eventVenue}
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                <Badge
                                                    bg="light"
                                                    text="dark"
                                                    className="border me-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    {item.ticketType}
                                                </Badge>
                                                <span className="small text-muted">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-sm-end">
                                            <div className="fw-bold" style={{ color: '#ff940a' }}>
                                                {(item.price * item.quantity).toFixed(2)} RSD
                                            </div>
                                            <div className="text-muted small">
                                                {item.price.toFixed(2)} RSD / karta
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Footer narudžbine */}
                                <div className="px-3 py-2 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 bg-light">
                                    <div className="text-muted small">
                                        Br. narudžbine: <span className="font-monospace">{order._id}</span>
                                    </div>
                                    <div>
                                        {order.isPaid && order.paidAt && (
                                            <span className="text-success small me-3">
                                                <FaClock className="me-1" />
                                                Plaćeno: {new Date(order.paidAt).toLocaleDateString('sr-Latn-RS')}
                                            </span>
                                        )}
                                        <span className="fw-bold">
                                            Ukupno: {order.totalPrice.toFixed(2)} RSD
                                        </span>
                                    </div>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </>
    );
};

export default MyOrdersScreen;