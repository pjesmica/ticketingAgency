import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';

const Event = ({ event }) => {
    console.log("EVENT:", event);

    if (!event) return null;

    const minPrice =
        event.ticketTypes?.length > 0
            ? Math.min(...event.ticketTypes.map((t) => t.price))
            : null;

    const date = event.date ? new Date(event.date) : null;

const formattedDate = date
    ? `${date.getDate()}. ${date.toLocaleString('sr-Latn-RS', {
          month: 'long',
      })} ${date.getFullYear()}`
    : '';

    const eventId = event?._id;

    return (
        <Link
            to={eventId ? `/events/${eventId}` : '#'}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <Card className="h-100 shadow-sm border-0">

                {/* IMAGE */}
                <div style={{ position: 'relative' }}>
                    <Card.Img
                        variant="top"
                        src={event.image}
                        style={{
                            height: 200,
                            objectFit: 'cover',
                        }}
                        onError={(e) =>
                            (e.target.src =
                                'https://via.placeholder.com/400x220')
                        }
                    />

                    <Badge
                        bg="success"
                        style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                        }}
                    >
                        {event.category}
                    </Badge>
                </div>

                {/* BODY */}
                <Card.Body>

                    <Card.Title className="fw-bold">
                        {event.name}
                    </Card.Title>

                    {/* META */}
                    <div className="text-muted small d-flex flex-column gap-1">

                        <div className="d-flex align-items-center gap-2">
                            <FaCalendarAlt />
                            {formattedDate}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <FaClock />
                            {event.time}h
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <FaMapMarkerAlt />
                            {event.venue?.name
                                ? `${event.venue.name}, ${event.venue.city}`
                                : event.location || ''}
                        </div>

                    </div>

                    {/* PRICE */}
                    {minPrice !== null && (
                        <div className="mt-3 fw-bold text-success">
                            Od {minPrice.toLocaleString('sr-RS')} RSD
                        </div>
                    )}

                </Card.Body>
            </Card>
        </Link>
    );
};

export default Event;