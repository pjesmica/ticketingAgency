import React from "react";
import { Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";

const Event = ({ event }) => {
  return (
    <Card className="event-card my-3 rounded-3 overflow-hidden">
      <Link to={`/events/${event._id}`}>
        <div className="event-img-wrapper">
          <Card.Img src={event.image} className="event-img" />
        </div>
      </Link>

      <Card.Body className="p-3">
        <Link to={`/events/${event._id}`} className="text-decoration-none">
          <Card.Title className="fw-bold mb-2 event-title">
            {event.name}
          </Card.Title>
        </Link>

        <div className="d-flex gap-2 mb-2 flex-wrap">
          <Badge bg="primary">{event.date}</Badge>
          <Badge bg="secondary" text="dark">
            {event.time}h
          </Badge>
        </div>

        <Card.Text className="event-location mb-0">
          {event.location}
        </Card.Text>
        <Badge bg="secondary" text="dark">
          {event.category}
        </Badge>
      </Card.Body>
    </Card>
  );
};

export default Event;
