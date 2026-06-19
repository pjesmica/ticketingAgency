import React from 'react';
import { Table, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaTrash, FaEdit, FaUsers, FaCheck, FaTimes } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetUsersQuery, useDeleteUserMutation } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';

const AdminUsersScreen = () => {
    const { data: users, isLoading, error, refetch } = useGetUsersQuery();
    const [deleteUser] = useDeleteUserMutation();

    const deleteHandler = async (id) => {
        if (window.confirm('Obrisati ovog korisnika?')) {
            try {
                await deleteUser(id).unwrap();
                toast.success('Korisnik obrisan');
                refetch();
            } catch (err) {
                toast.error(err?.data?.message || err.error);
            }
        }
    };

    return (
        <>
            <Row className='align-items-center mb-4'>
                <Col>
                    <h1 className='fw-bold mb-0'>
                        <FaUsers className='me-2 text-success' />
                        Upravljanje Korisnicima
                    </h1>
                    <p className='text-muted mt-1 mb-0'>
                        {users?.length || 0} registrovanih korisnika
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
                                <th>Ime</th>
                                <th>Email</th>
                                <th>Admin</th>
                                <th>Registrovan</th>
                                <th className='text-end'>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((user) => (
                                <tr key={user._id}>
                                    <td className='fw-semibold'>{user.name}</td>
                                    <td>
                                        <a href={`mailto:${user.email}`} className='text-decoration-none'>
                                            {user.email}
                                        </a>
                                    </td>
                                    <td>
                                        {user.isAdmin ? (
                                            <Badge bg='success'>
                                                <FaCheck className='me-1' />
                                                Admin
                                            </Badge>
                                        ) : (
                                            <Badge bg='secondary'>
                                                <FaTimes className='me-1' />
                                                Korisnik
                                            </Badge>
                                        )}
                                    </td>
                                    <td className='small text-muted'>
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString('sr-RS')
                                            : '-'}
                                    </td>
                                    <td className='text-end'>
                                        <div className='d-flex gap-2 justify-content-end'>
                                            <LinkContainer to={`/admin/users/${user._id}/edit`}>
                                                <Button variant='outline-primary' size='sm'>
                                                    <FaEdit />
                                                </Button>
                                            </LinkContainer>
                                            <Button
                                                variant='outline-danger'
                                                size='sm'
                                                onClick={() => deleteHandler(user._id)}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
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

export default AdminUsersScreen;
