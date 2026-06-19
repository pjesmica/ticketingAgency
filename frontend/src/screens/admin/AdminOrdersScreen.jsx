import React from 'react';
import { Table, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaEye, FaChartBar, FaCheck, FaTimes } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';

const AdminOrdersScreen = () => {
    const { data: orders, isLoading, error } = useGetOrdersQuery();

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('sr-RS', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const totalRevenue = orders?.filter((o) => o.isPaid).reduce((sum, o) => sum + o.totalPrice, 0) || 0;
    const paidCount = orders?.filter((o) => o.isPaid).length || 0;

    return (
        <>
            <Row className='align-items-center mb-4'>
                <Col>
                    <h1 className='fw-bold mb-0'>
                        <FaChartBar className='me-2 text-success' />
                        Narudžbine
                    </h1>
                    <p className='text-muted mt-1 mb-0'>
                        {orders?.length || 0} ukupno • {paidCount} plaćenih • Prihod: {totalRevenue.toLocaleString()} RSD
                    </p>
                </Col>
            </Row>

            {isLoading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error?.data?.message || error.error}</Message>
            ) : (
                <div className='table-responsive'>
                    <Table hover className='align-middle'>
                        <thead className='table-light'>
                            <tr>
                                <th>ID</th>
                                <th>Korisnik</th>
                                <th>Datum</th>
                                <th>Ukupno</th>
                                <th>Plaćeno</th>
                                <th className='text-end'>Detalji</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders?.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <code className='small'>{order._id.slice(-8)}</code>
                                    </td>
                                    <td>{order.user?.name || 'N/A'}</td>
                                    <td className='small text-muted'>
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className='fw-semibold'>
                                        {order.totalPrice?.toLocaleString()} RSD
                                    </td>
                                    <td>
                                        {order.isPaid ? (
                                            <Badge bg='success'>
                                                <FaCheck className='me-1' />
                                                Plaćeno
                                            </Badge>
                                        ) : (
                                            <Badge bg='warning' text='dark'>
                                                <FaTimes className='me-1' />
                                                Čeka
                                            </Badge>
                                        )}
                                    </td>
                                    <td className='text-end'>
                                        <LinkContainer to={`/order/${order._id}`}>
                                            <Button variant='outline-success' size='sm'>
                                                <FaEye className='me-1' />
                                                Pogledaj
                                            </Button>
                                        </LinkContainer>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </>
    );
};

export default AdminOrdersScreen;
