import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Badge, Button } from 'react-bootstrap';
import {
    FaUser,
    FaTicketAlt,
    FaShoppingCart,
    FaCalendarAlt,
    FaUsers,
    FaChartBar,
    FaBolt,
} from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import { clearCart } from '../slices/cartSlice';

const Header = () => {
    const { cartItems } = useSelector((state) => state.cart);
    const { userInfo } = useSelector((state) => state.auth);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [logoutApiCall] = useLogoutMutation();

    const cartCount = cartItems.reduce((a, c) => a + c.quantity, 0);

    const logoutHandler = async () => {
        try {
            await logoutApiCall().unwrap();
        } catch (err) {}

        dispatch(logout());
        dispatch(clearCart());
        navigate('/');
    };

    return (
        <Navbar
            expand="md"
            bg="light"
            className="border-bottom shadow-sm"
            style={{ position: 'relative', zIndex: 1030 }}
        >
            <Container>

                {/* BRAND */}
                <LinkContainer to="/">
    <Navbar.Brand className="d-flex align-items-center align-items-center">
        <img
            src="/logoLettersPhoto.png"
            alt="Ticketyx"
            style={{ height: '40px', objectFit: 'contain' }}
        />
    </Navbar.Brand>
</LinkContainer>

                <Navbar.Toggle />

                <Navbar.Collapse>

                    <Nav className="ms-auto align-items-center gap-2">

                        {/* EVENTS */}
                        <LinkContainer to="/">
                            <Nav.Link className="d-flex align-items-center gap-1">
                                <FaCalendarAlt />
                                Događaji
                            </Nav.Link>
                        </LinkContainer>

                        {/* CART */}
                        {userInfo && (
                            <LinkContainer to="/cart">
                                <Nav.Link className="d-flex align-items-center gap-1">
                                    <FaShoppingCart />
                                    Korpa

                                    {cartCount > 0 && (
                                        <Badge bg="success">
                                            {cartCount}
                                        </Badge>
                                    )}
                                </Nav.Link>
                            </LinkContainer>
                        )}

                        {/* USER MENU */}
                        {userInfo ? (
                            <NavDropdown
                                title={
                                    <span className="fw-bold">
                                        {userInfo.name.split(' ')[0]}
                                    </span>
                                }
                                align="end"
                            >

                                <LinkContainer to="/profile">
                                    <NavDropdown.Item>
                                        <FaUser className="me-2" />
                                        Moj profil
                                    </NavDropdown.Item>
                                </LinkContainer>

                                <LinkContainer to="/myorders">
                                    <NavDropdown.Item>
                                        <FaTicketAlt className="me-2" />
                                        Moje karte
                                    </NavDropdown.Item>
                                </LinkContainer>

                                {/* ADMIN */}
                                {userInfo.isAdmin && (
                                    <>
                                        <NavDropdown.Divider />

                                        <NavDropdown.Header>
                                            ADMIN
                                        </NavDropdown.Header>

                                        <LinkContainer to="/admin">
                                            <NavDropdown.Item>
                                                <FaBolt className="me-2" />
                                                Dashboard
                                            </NavDropdown.Item>
                                        </LinkContainer>

                                        <LinkContainer to="/admin/events">
                                            <NavDropdown.Item>
                                                <FaCalendarAlt className="me-2" />
                                                Događaji
                                            </NavDropdown.Item>
                                        </LinkContainer>

                                        <LinkContainer to="/admin/users">
                                            <NavDropdown.Item>
                                                <FaUsers className="me-2" />
                                                Korisnici
                                            </NavDropdown.Item>
                                        </LinkContainer>

                                        <LinkContainer to="/admin/orders">
                                            <NavDropdown.Item>
                                                <FaChartBar className="me-2" />
                                                Narudžbine
                                            </NavDropdown.Item>
                                        </LinkContainer>
                                    </>
                                )}

                                <NavDropdown.Divider />

                                <NavDropdown.Item
                                    onClick={logoutHandler}
                                    className="text-danger"
                                >
                                    Odjava
                                </NavDropdown.Item>

                            </NavDropdown>
                        ) : (
                            <div className="d-flex gap-2">

                                <LinkContainer to="/login">
                                    <Button variant="outline-success" size="sm">
                                        <FaUser className="me-1" />
                                        Prijava
                                    </Button>
                                </LinkContainer>

                                <LinkContainer to="/register">
                                    <Button variant="success" size="sm">
                                        Registracija
                                    </Button>
                                </LinkContainer>

                            </div>
                        )}

                    </Nav>

                </Navbar.Collapse>

            </Container>
        </Navbar>
    );
};

export default Header;