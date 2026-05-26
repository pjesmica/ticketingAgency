import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaSave, FaTicketAlt } from 'react-icons/fa';
import { useGetProfileQuery, useUpdateProfileMutation } from '../slices/usersApiSlice';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import { setCredentials } from '../slices/authSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { Link } from 'react-router-dom';

const ProfileScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);

    const { data: profile, isLoading: loadingProfile, error: errorProfile } = useGetProfileQuery();
    const { data: orders, isLoading: loadingOrders } = useGetMyOrdersQuery();
    const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setEmail(profile.email);
        }
    }, [profile]);

    const submitHandler = async (e) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            toast.error('Lozinke se ne poklapaju');
            return;
        }

        try {
            const res = await updateProfile({
                name,
                email,
                ...(password && { password }),
            }).unwrap();

            dispatch(setCredentials({ ...userInfo, name: res.name, email: res.email }));
            setPassword('');
            setConfirmPassword('');
            toast.success('Profil uspešno ažuriran');
        } catch (err) {
            toast.error(err?.data?.message || err.error);
        }
    };

    // Broj kupljenih karata kroz sve narudžbine
    const totalTickets = orders
        ? orders.reduce((acc, o) => acc + o.orderItems.reduce((a, i) => a + i.quantity, 0), 0)
        : 0;

    const paidOrders = orders ? orders.filter((o) => o.isPaid).length : 0;

    return (
        <Row className="g-4 mt-1">

            {/* LEFT: Forma */}
            <Col md={5}>
                <Card className="shadow-sm border-0 p-4">
                    <h4 className="mb-4 d-flex align-items-center gap-2">
                        <FaUser /> Moj profil
                    </h4>

                    {loadingProfile ? (
                        <Loader />
                    ) : errorProfile ? (
                        <Message variant="danger">Greška pri učitavanju profila</Message>
                    ) : (
                        <Form onSubmit={submitHandler}>
                            <Form.Group controlId="name" className="mb-3">
                                <Form.Label>
                                    <FaUser className="me-1 text-muted" /> Ime i prezime
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="email" className="mb-3">
                                <Form.Label>
                                    <FaEnvelope className="me-1 text-muted" /> Email adresa
                                </Form.Label>
                                <Form.Control
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <hr className="my-3" />
                            <p className="text-muted small mb-2">
                                <FaLock className="me-1" />
                                Ostavi prazno ako ne želiš da menjaš lozinku
                            </p>

                            <Form.Group controlId="password" className="mb-3">
                                <Form.Label>Nova lozinka</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Nova lozinka"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group controlId="confirmPassword" className="mb-4">
                                <Form.Label>Potvrda nove lozinke</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Potvrdite novu lozinku"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={updating}
                                >
                                    <FaSave className="me-2" />
                                    {updating ? 'Čuvanje...' : 'Sačuvaj izmene'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card>
            </Col>

            {/* RIGHT: Statistike + poslednje narudžbine */}
            <Col md={7}>

                {/* Statistike */}
                <Row className="g-3 mb-4">
                    <Col xs={6}>
                        <Card className="border-0 shadow-sm text-center p-3">
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ff940a' }}>
                                {loadingOrders ? '...' : orders?.length ?? 0}
                            </div>
                            <div className="text-muted small">Ukupno narudžbina</div>
                        </Card>
                    </Col>
                    <Col xs={6}>
                        <Card className="border-0 shadow-sm text-center p-3">
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                                {loadingOrders ? '...' : totalTickets}
                            </div>
                            <div className="text-muted small">Kupljenih karata</div>
                        </Card>
                    </Col>
                </Row>

                {/* Poslednje 3 narudžbine */}
                <Card className="border-0 shadow-sm p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0 d-flex align-items-center gap-2">
                            <FaTicketAlt /> Poslednje narudžbine
                        </h5>
                        <Link to="/myorders" className="small">
                            Vidi sve →
                        </Link>
                    </div>

                    {loadingOrders ? (
                        <Loader />
                    ) : !orders || orders.length === 0 ? (
                        <Message variant="info">Još uvek niste kupili karte.</Message>
                    ) : (
                        orders.slice(0, 3).map((order) => (
                            <div
                                key={order._id}
                                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                            >
                                <div>
                                    <div className="fw-bold small">
                                        {order.orderItems[0]?.eventName}
                                        {order.orderItems.length > 1 && (
                                            <span className="text-muted fw-normal">
                                                {' '}+{order.orderItems.length - 1} još
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {new Date(order.createdAt).toLocaleDateString('sr-Latn-RS')}
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold small">
                                        {order.totalPrice.toFixed(2)} RSD
                                    </span>
                                    <Badge bg={order.isPaid ? 'success' : 'warning'} text={order.isPaid ? 'white' : 'dark'}>
                                        {order.isPaid ? 'Plaćeno' : 'Na čekanju'}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default ProfileScreen;