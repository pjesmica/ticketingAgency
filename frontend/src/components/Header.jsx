import React, { useState } from "react";
import { Navbar, Container, Nav, Form, Button } from "react-bootstrap";
import { FaUser } from "react-icons/fa";
import logo from "../assets/logo.png";
import { LinkContainer } from "react-router-bootstrap";

const Header = () => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    document.body.setAttribute("data-bs-theme", newMode ? "dark" : "light");
  };

  return (
    <header>
      <Navbar
        bg={darkMode ? "dark" : "primary"}
        variant="dark"
        expand="md"
        collapseOnSelect
        className="shadow-sm py-2"
      >
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand className="d-flex align-items-center gap-2">
              <img
                src={logo}
                alt="Ticketyx logo"
                width="34"
                height="34"
                className="rounded-circle border border-light"
              />
              <span className="fw-bold fs-5">Ticketyx</span>
            </Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle />

          <Navbar.Collapse className="justify-content-end">
            <Nav className="align-items-center gap-3">
              <Form className="d-flex align-items-center gap-2 text-white">
                <span style={{ fontSize: "0.85rem" }}>
                  {darkMode ? "Dark" : "Light"}
                </span>



                <Form.Check
                  type="switch"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  className="m-0"
                />
              </Form>

              {user ? (
                <Button
                  variant="light"
                  className="d-flex align-items-center gap-2"
                >
                  <FaUser />
                  {user.name}
                </Button>
              ) : (
                <LinkContainer to="/login">
                  <Button
                    variant="outline-light"
                    className="d-flex align-items-center gap-2"
                  >
                    <FaUser />
                    Login
                  </Button>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
