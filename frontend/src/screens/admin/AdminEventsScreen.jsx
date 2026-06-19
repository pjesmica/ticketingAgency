import React from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Table, Button, Row, Col, Badge } from "react-bootstrap";
import {
  FaEdit,
  FaTrash,
  FaTheaterMasks,
  FaPlus,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTicketAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import {
  useGetAllEventsAdminQuery,
  useDeleteEventMutation,
} from "../../slices/eventsApiSlice";
import { toast } from "react-toastify";

const AdminEventsScreen = () => {
  const navigate = useNavigate();
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useGetAllEventsAdminQuery();

  const [deleteEvent, { isLoading: loadingDelete }] = useDeleteEventMutation();

  const deleteHandler = async (id) => {
    if (window.confirm("Obrisati ovaj događaj?")) {
      try {
        await deleteEvent(id).unwrap();
        toast.success("Događaj obrisan");
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSameDay = (start, end) => {
    if (!start || !end) return true;
    return new Date(start).toDateString() === new Date(end).toDateString();
  };

  return (
    <>
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="fw-bold mb-0">
            <FaCalendarAlt className="me-2 text-success" />
            Upravljanje Događajima
          </h1>
          <p className="text-muted mt-1 mb-0">
            {events?.length || 0} ukupno događaja
          </p>
        </Col>

        <Col xs="auto">
          <Button
            onClick={() => navigate("/admin/events/new")}
            variant="success"
            className="d-flex align-items-center gap-2"
          >
            <FaPlus />
            Novi Događaj
          </Button>
        </Col>
      </Row>

      {loadingDelete && <Loader />}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Naziv</th>
                <th>Kategorija</th>
                <th>Mesto</th>
                <th>Datum</th>
                <th>Status</th>
                <th>Karte</th>
                <th className="text-end">Akcije</th>
              </tr>
            </thead>

            <tbody>
              {events?.map((event) => (
                <tr key={event._id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {event.image && (
                        <img
                          src={event.image}
                          alt={event.name}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      )}
                      <span className="fw-semibold">{event.name}</span>
                    </div>
                  </td>

                  <td>
                    <Badge bg="secondary">{event.category}</Badge>
                  </td>

                  <td>
                    <span className="d-flex align-items-center gap-1 text-muted small">
                      <FaMapMarkerAlt />
                      {event.venue?.city}
                    </span>
                  </td>

                  <td className="small">
                    {isSameDay(event.startDate, event.endDate)
                      ? formatDate(event.startDate)
                      : `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`}
                    <div className="text-muted">
                      {formatTime(event.startDate)}
                    </div>
                  </td>

                  <td>
                    {event.isActive ? (
                      <Badge bg="success">Aktivan</Badge>
                    ) : (
                      <Badge bg="secondary">Neaktivan</Badge>
                    )}
                  </td>

                  <td>
                    <span className="d-flex align-items-center gap-1 small">
                      <FaTicketAlt className="text-success" />
                      {event.ticketTypes?.reduce(
                        (sum, t) => sum + t.availableQuantity,
                        0,
                      ) || 0}{" "}
                      /{" "}
                      {event.ticketTypes?.reduce(
                        (sum, t) => sum + t.totalQuantity,
                        0,
                      ) || 0}
                    </span>
                  </td>

                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <LinkContainer to={`/admin/venue/${event._id}`}>
                        <Button
                          variant="outline-success"
                          size="sm"
                          title="Dizajner sale"
                        >
                          <FaTheaterMasks />
                        </Button>
                      </LinkContainer>

                      <LinkContainer to={`/admin/events/${event._id}/edit`}>
                        <Button variant="outline-primary" size="sm">
                          <FaEdit />
                        </Button>
                      </LinkContainer>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteHandler(event._id)}
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

export default AdminEventsScreen;
