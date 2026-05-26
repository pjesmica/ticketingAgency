import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [login, { isLoading }] = useLoginMutation();
    const { userInfo } = useSelector((state) => state.auth);

    const { search } = useLocation();
    const sp = new URLSearchParams(search);
    const redirect = sp.get('redirect') || '/';

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [userInfo, redirect, navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await login({ email, password }).unwrap();
            dispatch(setCredentials({ ...res }));
            navigate(redirect);
        } catch (err) {
            toast.error(err?.data?.message || err.error);
        }
    };

    return (
        <Row className="justify-content-center mt-5">
            <Col xs={12} sm={10} md={7} lg={5}>
                <Card className="shadow-sm border-0 p-4">
                    <h2 className="mb-4 text-center">Prijava</h2>

                    <Form onSubmit={submitHandler}>
                        <Form.Group controlId="email" className="mb-3">
                            <Form.Label>Email adresa</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Unesite email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="password" className="mb-4">
                            <Form.Label>Lozinka</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Unesite lozinku"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Prijavljivanje...' : 'Prijava'}
                            </Button>
                        </div>

                        {isLoading && <Loader />}
                    </Form>

                    <Row className="mt-3">
                        <Col className="text-center text-muted">
                            Nemate nalog?{' '}
                            <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
                                Registrujte se
                            </Link>
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
    );
};

export default LoginScreen;