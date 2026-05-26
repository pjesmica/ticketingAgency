import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { FaInstagram, FaTwitter, FaFacebook } from 'react-icons/fa';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-light border-top mt-5 py-4">

            <Container>

                <Row className="align-items-center">

                    {/* LEFT - LOGO */}
                    <Col md={4} className="mb-3 mb-md-0">

                        <div className="d-flex align-items-center gap-2 mb-2">
                            <img
                                src="/logoLettersPhoto.png"
                                alt="Ticketyx"
                                style={{ height: '40px', objectFit: 'contain' }}
                            />
                        </div>

                        <p className="text-muted small mb-0">
                            Vaš pouzdan partner za kupovinu karata za koncerte, festivale, sport i pozorište.
                        </p>

                    </Col>

                    {/* CENTER LINKS */}
                    <Col md={4} className="text-md-center mb-3 mb-md-0">

                        <div className="d-flex justify-content-md-center gap-3">

                            <Link to="/" className="text-muted text-decoration-none">
                                Događaji
                            </Link>

                            <Link to="/login" className="text-muted text-decoration-none">
                                Prijava
                            </Link>

                            <Link to="/register" className="text-muted text-decoration-none">
                                Registracija
                            </Link>

                        </div>

                    </Col>

                    {/* RIGHT SOCIAL */}
                    <Col md={4} className="text-md-end">

                        <div className="d-flex justify-content-md-end gap-3 mb-2">

                            <a href="#!" className="text-muted fs-5">
                                <FaInstagram />
                            </a>

                            <a href="#!" className="text-muted fs-5">
                                <FaTwitter />
                            </a>

                            <a href="#!" className="text-muted fs-5">
                                <FaFacebook />
                            </a>

                        </div>

                        <p className="text-muted small mb-0">
                            © {year} Ticketyx. Sva prava zadržana.
                        </p>

                    </Col>

                </Row>

            </Container>

        </footer>
    );
};

export default Footer;