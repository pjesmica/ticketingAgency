import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import {
    FaCalendarAlt,
    FaUsers,
    FaChartBar,
    FaTicketAlt,
    FaPlus,
    FaBolt,
    FaTheaterMasks,
    FaLayerGroup,
} from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { useGetAllEventsAdminQuery } from '../../slices/eventsApiSlice';
import { useGetUsersQuery } from '../../slices/usersApiSlice';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';

const StatCard = ({ icon, title, value, sub, color, to }) => (
    <Card className='border-0 shadow-sm h-100 position-relative overflow-hidden'>
        <div
            style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `${color}15`,
            }}
        />
        <Card.Body className='p-4'>
            <div
                className='d-inline-flex align-items-center justify-content-center rounded-3 mb-3'
                style={{
                    width: 48,
                    height: 48,
                    background: `${color}20`,
                    color,
                    fontSize: 22,
                }}
            >
                {icon}
            </div>
            <h3 className='fw-bold mb-0 display-6'>{value}</h3>
            <p className='fw-semibold mb-1'>{title}</p>
            <p className='text-muted small mb-3'>{sub}</p>
            {to && (
                <LinkContainer to={to}>
                    <Button variant='outline-secondary' size='sm'>
                        Upravljaj →
                    </Button>
                </LinkContainer>
            )}
        </Card.Body>
    </Card>
);

const AdminDashboardScreen = () => {
    const { data: events, isLoading: loadingEvents } = useGetAllEventsAdminQuery();
    const { data: users, isLoading: loadingUsers } = useGetUsersQuery();
    const { data: orders, isLoading: loadingOrders } = useGetOrdersQuery();

    const activeEvents = events?.filter((e) => e.isActive).length || 0;
    const paidOrders = orders?.filter((o) => o.isPaid).length || 0;
    const totalRevenue = orders?.filter((o) => o.isPaid).reduce((s, o) => s + o.totalPrice, 0) || 0;

    const loading = loadingEvents || loadingUsers || loadingOrders;

    return (
        <>
            <div className='d-flex align-items-center gap-2 mb-4'>
                <FaBolt className='text-success' size={28} />
                <div>
                    <h1 className='fw-bold mb-0'>Admin Panel</h1>
                    <p className='text-muted mb-0 small'>Pregled sistema</p>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <>
                    <Row className='g-4 mb-5'>
                        <Col md={6} xl={3}>
                            <StatCard
                                icon={<FaCalendarAlt />}
                                title='Događaji'
                                value={events?.length || 0}
                                sub={`${activeEvents} aktivnih`}
                                color='#198754'
                                to='/admin/events'
                            />
                        </Col>
                        <Col md={6} xl={3}>
                            <StatCard
                                icon={<FaUsers />}
                                title='Korisnici'
                                value={users?.length || 0}
                                sub='registrovanih korisnika'
                                color='#0d6efd'
                                to='/admin/users'
                            />
                        </Col>
                        <Col md={6} xl={3}>
                            <StatCard
                                icon={<FaTicketAlt />}
                                title='Narudžbine'
                                value={orders?.length || 0}
                                sub={`${paidOrders} plaćenih`}
                                color='#fd7e14'
                                to='/admin/orders'
                            />
                        </Col>
                        <Col md={6} xl={3}>
                            <StatCard
                                icon={<FaChartBar />}
                                title='Prihod'
                                value={`${totalRevenue.toLocaleString()} RSD`}
                                sub='od plaćenih narudžbina'
                                color='#6610f2'
                            />
                        </Col>
                    </Row>

                    {/* QUICK ACTIONS */}
                    <h5 className='fw-bold mb-3'>Brze akcije</h5>
                    <Row className='g-3'>
                        <Col sm={6} md={4}>
                            <LinkContainer to='/admin/events'>
                                <Card
                                    as='button'
                                    className='border-0 shadow-sm w-100 text-start p-3 cursor-pointer'
                                    style={{ cursor: 'pointer', background: '#f8fff9' }}
                                >
                                    <div className='d-flex align-items-center gap-3'>
                                        <div className='p-2 bg-success bg-opacity-10 rounded-3'>
                                            <FaCalendarAlt className='text-success' size={20} />
                                        </div>
                                        <div>
                                            <div className='fw-semibold'>Upravljaj događajima</div>
                                            <div className='small text-muted'>Dodaj, uredi ili obriši</div>
                                        </div>
                                    </div>
                                </Card>
                            </LinkContainer>
                        </Col>
                        <Col sm={6} md={4}>
                            <LinkContainer to='/admin/users'>
                                <Card
                                    as='button'
                                    className='border-0 shadow-sm w-100 text-start p-3'
                                    style={{ cursor: 'pointer', background: '#f0f4ff' }}
                                >
                                    <div className='d-flex align-items-center gap-3'>
                                        <div className='p-2 bg-primary bg-opacity-10 rounded-3'>
                                            <FaUsers className='text-primary' size={20} />
                                        </div>
                                        <div>
                                            <div className='fw-semibold'>Upravljaj korisnicima</div>
                                            <div className='small text-muted'>Pregled i izmena</div>
                                        </div>
                                    </div>
                                </Card>
                            </LinkContainer>
                        </Col>
                        <Col sm={6} md={4}>
                            <LinkContainer to='/admin/orders'>
                                <Card
                                    as='button'
                                    className='border-0 shadow-sm w-100 text-start p-3'
                                    style={{ cursor: 'pointer', background: '#fff8f0' }}
                                >
                                    <div className='d-flex align-items-center gap-3'>
                                        <div className='p-2 bg-warning bg-opacity-10 rounded-3'>
                                            <FaChartBar className='text-warning' size={20} />
                                        </div>
                                        <div>
                                            <div className='fw-semibold'>Pregled narudžbina</div>
                                            <div className='small text-muted'>Plaćanja i detalji</div>
                                        </div>
                                    </div>
                                </Card>
                            </LinkContainer>
                        </Col>
                        <Col sm={6} md={4}>
                            <LinkContainer to='/admin/venue-templates'>
                                <Card
                                    as='button'
                                    className='border-0 shadow-sm w-100 text-start p-3'
                                    style={{ cursor: 'pointer', background: '#f0fff4' }}
                                >
                                    <div className='d-flex align-items-center gap-3'>
                                        <div className='p-2 bg-success bg-opacity-10 rounded-3'>
                                            <FaTheaterMasks className='text-success' size={20} />
                                        </div>
                                        <div>
                                            <div className='fw-semibold'>Šabloni sala</div>
                                            <div className='small text-muted'>Upravljaj rasporedima sedišta</div>
                                        </div>
                                    </div>
                                </Card>
                            </LinkContainer>
                        </Col>
                        <Col sm={6} md={4}>
                            <LinkContainer to='/admin/venue'>
                                <Card
                                    as='button'
                                    className='border-0 shadow-sm w-100 text-start p-3'
                                    style={{ cursor: 'pointer', background: '#f5f0ff' }}
                                >
                                    <div className='d-flex align-items-center gap-3'>
                                        <div className='p-2 rounded-3' style={{ background: '#8b5cf620' }}>
                                            <FaLayerGroup style={{ color: '#8b5cf6' }} size={20} />
                                        </div>
                                        <div>
                                            <div className='fw-semibold'>Dizajner sale</div>
                                            <div className='small text-muted'>Nacrtaj raspored</div>
                                        </div>
                                    </div>
                                </Card>
                            </LinkContainer>
                        </Col>
                    </Row>
                </>
            )}
        </>
    );
};

export default AdminDashboardScreen;