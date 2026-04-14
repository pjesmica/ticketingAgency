import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto py-4 border-top">
      <Container>
        <Row>
          <Col className="text-center">
            <p className="mb-0 text-muted">
              © {currentYear} Ticketyx. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );



};
//komentartest23dsw
export default Footer;
