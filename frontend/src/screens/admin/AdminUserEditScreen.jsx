import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaUser } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetUserByIdQuery, useUpdateUserMutation } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';

const AdminUserEditScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: user, isLoading, error } = useGetUserByIdQuery(id);
    const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setIsAdmin(user.isAdmin ?? false);
        }
    }, [user]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await updateUser({ id, name, email, isAdmin }).unwrap();
            toast.success('Korisnik ažuriran');
            navigate('/admin/users');
        } catch (err) {
            toast.error(err?.data?.message || err.error);
        }
    };

    if (isLoading) return <Loader />;
    if (error) return <Message variant='danger'>{error?.data?.message}</Message>;

    return (
        <>
            <div className='d-flex align-items-center gap-3 mb-4'>
                <LinkContainer to='/admin/users'>
                    <Button variant='outline-secondary' size='sm'>
                        <FaArrowLeft />
                    </Button>
                </LinkContainer>
                <h1 className='fw-bold mb-0'>
                    <FaUser className='me-2 text-success' />
                    Uredi Korisnika
                </h1>
            </div>

            <Row className='justify-content-center'>
                <Col md={6}>
                    <Card className='border-0 shadow-sm'>
                        <Card.Body className='p-4'>
                            <Form onSubmit={submitHandler}>
                                <Form.Group className='mb-3'>
                                    <Form.Label className='fw-semibold'>Ime</Form.Label>
                                    <Form.Control
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className='mb-3'>
                                    <Form.Label className='fw-semibold'>Email</Form.Label>
                                    <Form.Control
                                        type='email'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Check
                                    type='switch'
                                    id='isAdmin-switch'
                                    label='Admin privilegije'
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                    className='mb-4'
                                />

                                <div className='d-grid gap-2'>
                                    <Button
                                        type='submit'
                                        variant='success'
                                        disabled={loadingUpdate}
                                        className='d-flex align-items-center justify-content-center gap-2'
                                    >
                                        <FaSave />
                                        Sačuvaj
                                    </Button>
                                    <LinkContainer to='/admin/users'>
                                        <Button variant='outline-secondary'>Odustani</Button>
                                    </LinkContainer>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default AdminUserEditScreen;
