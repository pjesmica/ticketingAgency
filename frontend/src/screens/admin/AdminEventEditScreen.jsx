import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card, Badge } from "react-bootstrap";
import {
  FaArrowLeft,
  FaSave,
  FaPlus,
  FaTrash,
  FaImage,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaToggleOn,
  FaChair,
} from "react-icons/fa";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import {
  useGetEventDetailsQuery,
  useUpdateEventMutation,
  useCreateEventMutation,
} from "../../slices/eventsApiSlice";
import {
  useGetVenueSectionTemplatesQuery,
  useApplyVenueSectionTemplateMutation,
} from "../../slices/venueSectionTemplateApiSlice";
import { useGetVenueSectionsQuery } from "../../slices/venueSectionApiSlice";
import { toast } from "react-toastify";
import { LinkContainer } from "react-router-bootstrap";

const CATEGORIES = [
  "Koncerti",
  "Festivali",
  "Sport",
  "Pozorište",
  "Komedija",
  "Ostalo",
];
const TICKET_NAME_SUGGESTIONS = [
  "Regular",
  "VIP",
  "Balkon",
  "Parter",
  "Student",
  "Dečija",
];

// ── Pregled slike ─────────────────────────────────────────────────────────────
const ImagePreview = ({ src, label }) => (
  <div className="mt-2">
    {src ? (
      <>
        <Form.Label className="fw-semibold d-block mb-2 small">
          {label}
        </Form.Label>
        <div
          style={{
            border: "2px dashed #dee2e6",
            borderRadius: 10,
            padding: 6,
            background: "#f8f9fa",
          }}
        >
          <img
            src={src}
            alt={label}
            style={{
              width: "100%",
              maxHeight: 200,
              objectFit: "cover",
              borderRadius: 6,
              display: "block",
            }}
          />
        </div>
      </>
    ) : (
      <div
        style={{
          border: "2px dashed #dee2e6",
          borderRadius: 10,
          padding: 24,
          textAlign: "center",
          color: "#adb5bd",
        }}
      >
        <FaImage size={28} className="mb-1" />
        <p className="mb-0 small">Unesite URL da vidite pregled</p>
      </div>
    )}
  </div>
);

// ── Jedna vrsta karte ─────────────────────────────────────────────────────────
const TicketTypeRow = ({ ticket, idx, total, onChange, onRemove }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = TICKET_NAME_SUGGESTIONS.filter(
    (s) =>
      s.toLowerCase().includes(ticket.name.toLowerCase()) && s !== ticket.name,
  );

  return (
    <div
      className="mb-3 p-3"
      style={{
        background: "#f8f9fa",
        borderRadius: 10,
        border: "1px solid #e9ecef",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Badge bg="success">Vrsta {idx + 1}</Badge>
        {total > 1 && (
          <Button
            variant="outline-danger"
            size="sm"
            type="button"
            onClick={onRemove}
          >
            <FaTrash />
          </Button>
        )}
      </div>

      <Row className="g-3">
        {/* NAZIV sa predlozima */}
        <Col md={4}>
          <Form.Group style={{ position: "relative" }}>
            <Form.Label className="small fw-semibold">Naziv</Form.Label>
            <Form.Control
              value={ticket.name}
              placeholder="npr. Regular, VIP..."
              size="sm"
              autoComplete="off"
              onChange={(e) => {
                onChange("name", e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && filtered.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #dee2e6",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                {filtered.map((s) => (
                  <div
                    key={s}
                    onMouseDown={() => {
                      onChange("name", s);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: "7px 12px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f0fdf4")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fff")
                    }
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </Form.Group>
        </Col>

        {/* CENA */}
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small fw-semibold">Cena (RSD)</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              value={
                ticket.price === 0 && !ticket._priceTouched ? "" : ticket.price
              }
              placeholder="0"
              size="sm"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onChange("price", val === "" ? 0 : Number(val));
                onChange("_priceTouched", true);
              }}
            />
          </Form.Group>
        </Col>

        {/* KOLIČINA */}
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small fw-semibold">Ukupno karata</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              value={
                ticket.totalQuantity === 100 && !ticket._qtyTouched
                  ? ""
                  : ticket.totalQuantity
              }
              placeholder="100"
              size="sm"
              style={
                ticket._qtyTouched && ticket.totalQuantity < 1
                  ? { borderColor: "#dc3545" }
                  : {}
              }
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onChange("totalQuantity", val === "" ? 0 : Number(val));
                onChange("availableQuantity", val === "" ? 0 : Number(val));
                onChange("_qtyTouched", true);
              }}
            />
            {ticket._qtyTouched && ticket.totalQuantity < 1 && (
              <Form.Text style={{ color: "#dc3545" }}>
                Mora biti bar 1
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

// ── Glavni ekran ──────────────────────────────────────────────────────────────
const AdminEventEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    data: event,
    isLoading,
    error,
  } = useGetEventDetailsQuery(id, { skip: !isEdit });
  const [updateEvent, { isLoading: loadingUpdate }] = useUpdateEventMutation();
  const [createEvent, { isLoading: loadingCreate }] = useCreateEventMutation();
  const { data: sectionTemplates } = useGetVenueSectionTemplatesQuery();
  const [applyVenueSectionTemplate, { isLoading: applyingTemplate }] =
    useApplyVenueSectionTemplateMutation();
  const { data: currentVenueLayout } = useGetVenueSectionsQuery(id, {
    skip: !isEdit || !id,
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [ticketImage, setTicketImage] = useState("");
  const [ticketImagePreview, setTicketImagePreview] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ostalo");
  const [venueName, setVenueName] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueCountry, setVenueCountry] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [time, setTime] = useState("20:00");
  const [isActive, setIsActive] = useState(true);
  const [hasSeatMap, setHasSeatMap] = useState(false);
  const [ticketTypes, setTicketTypes] = useState([
    { name: "Regular", price: 0, totalQuantity: 100, availableQuantity: 100 },
  ]);

  useEffect(() => {
    if (event) {
      setName(event.name || "");
      setImage(event.image || "");
      setImagePreview(event.image || "");
      setTicketImage(event.ticketImage || "");
      setTicketImagePreview(event.ticketImage || "");
      setDescription(event.description || "");
      setCategory(event.category || "Ostalo");
      setVenueName(event.venue?.name || "");
      setVenueCity(event.venue?.city || "");
      setVenueCountry(event.venue?.country || "");
      setVenueAddress(event.venue?.address || "");

      const start = event.startDate
        ? new Date(event.startDate).toISOString().split("T")[0]
        : "";
      const end = event.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : "";
      setStartDate(start);
      setEndDate(end);
      setMultiDay(start !== end);

      if (event.startDate) {
        const t = new Date(event.startDate);
        setTime(
          `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
        );
      }

      setIsActive(event.isActive ?? true);
      setHasSeatMap(event.hasSeatMap ?? false);
      setTicketTypes(
        event.ticketTypes?.length
          ? event.ticketTypes.map((t) => ({
              ...t,
              _priceTouched: true,
              _qtyTouched: true,
            }))
          : [
              {
                name: "Regular",
                price: 0,
                totalQuantity: 100,
                availableQuantity: 100,
              },
            ],
      );
    }
  }, [event]);

  const combineDateTime = (date, time) =>
    date ? new Date(`${date}T${time}:00`) : null;

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (!multiDay) setEndDate(val);
  };

  // ── Auto-popuni vrste karata iz sekcijskog šablona ───────────────────────
  const applyTemplateToTicketTypes = (template) => {
    if (!template?.sections?.length) return;

    // Grupiši sekcije po imenu (sekcija = ticket type)
    const grouped = {};
    for (const s of template.sections) {
      const cap =
        s.sectorType === "standing"
          ? s.capacity || 0
          : (s.rowCount || 0) * (s.seatsPerRow || 0);
      if (!grouped[s.name]) grouped[s.name] = 0;
      grouped[s.name] += cap;
    }

    // Sačuvaj postojeće cene ako su unete
    const existingPrices = {};
    ticketTypes.forEach((t) => {
      existingPrices[t.name] = t.price;
    });

    const newTypes = Object.entries(grouped).map(([name, qty]) => ({
      name,
      price: existingPrices[name] || 0,
      totalQuantity: qty,
      availableQuantity: qty,
    }));

    setTicketTypes(newTypes);
    setHasSeatMap(true);
    toast.success(
      `${newTypes.length} vrsta karata popunjeno iz šablona — unesite cene`,
    );
  };

  const addTicketType = () =>
    setTicketTypes([
      ...ticketTypes,
      { name: "", price: 0, totalQuantity: 100, availableQuantity: 100 },
    ]);

  const removeTicketType = (idx) =>
    setTicketTypes(ticketTypes.filter((_, i) => i !== idx));

  const updateTicketType = (idx, field, value) => {
    setTicketTypes((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Izgradi ticket mappings: ime sekcije → ticket type ID/name/price
  const buildTicketMappings = (savedEvent) => {
    if (!savedEvent?.ticketTypes?.length) return {};
    const mappings = {};
    for (const tt of savedEvent.ticketTypes) {
      mappings[tt.name] = {
        ticketTypeId: tt._id.toString(),
        ticketTypeName: tt.name,
        price: tt.price,
      };
    }
    return mappings;
  };

  const handleApplyTemplate = async (eventId, savedEvent) => {
    const targetId = eventId || id;
    if (!selectedTemplateId || !targetId) return;
    try {
      let evt = savedEvent;
      if (!evt && isEdit) {
        const payload = buildPayload();
        evt = await updateEvent({ id, ...payload }).unwrap();
      }
      const ticketMappings = buildTicketMappings(evt || event);
      const res = await applyVenueSectionTemplate({
        eventId: targetId,
        templateId: selectedTemplateId,
        ticketMappings,
      }).unwrap();
      setHasSeatMap(true);
      toast.success(res?.message || "Šablon primenjen");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const buildPayload = () => ({
    name,
    image,
    ticketImage,
    description,
    category,
    venue: {
      name: venueName,
      city: venueCity,
      country: venueCountry,
      address: venueAddress,
    },
    startDate: combineDateTime(startDate, time),
    endDate: multiDay
      ? combineDateTime(endDate, time)
      : combineDateTime(startDate, time),
    ticketTypes: ticketTypes.map(({ _priceTouched, _qtyTouched, ...t }) => t),
    isActive,
    hasSeatMap,
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Naziv je obavezan");
      return;
    }
    if (!image.trim()) {
      toast.error("URL slike je obavezan");
      return;
    }
    if (!description.trim()) {
      toast.error("Opis je obavezan");
      return;
    }
    if (!venueName.trim()) {
      toast.error("Naziv mesta je obavezan");
      return;
    }
    if (!venueCity.trim()) {
      toast.error("Grad je obavezan");
      return;
    }
    if (!startDate) {
      toast.error("Datum je obavezan");
      return;
    }
    if (!ticketTypes.length) {
      toast.error("Dodajte bar jednu vrstu karte");
      return;
    }
    for (const t of ticketTypes) {
      if (!t.name.trim()) {
        toast.error("Svaka vrsta karte mora imati naziv");
        return;
      }
      if (t.totalQuantity < 1) {
        toast.error(`Vrsta "${t.name}" mora imati bar 1 kartu`);
        return;
      }
    }

    const payload = buildPayload();

    try {
      if (isEdit) {
        const updated = await updateEvent({ id, ...payload }).unwrap();
        if (selectedTemplateId) await handleApplyTemplate(id, updated);
        toast.success("Događaj ažuriran");
        navigate("/admin/events");
      } else {
        const created = await createEvent(payload).unwrap();
        if (selectedTemplateId) await handleApplyTemplate(created._id, created);
        toast.success("Događaj kreiran!");
        navigate(`/admin/events/${created._id}/edit`);
      }
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant="danger">{error?.data?.message}</Message>;

  const isSaving = loadingUpdate || loadingCreate;

  // ── Sala panel ────────────────────────────────────────────────────────────
  const selectedTemplate = sectionTemplates?.find(
    (t) => t._id === selectedTemplateId,
  );

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <LinkContainer to="/admin/events">
          <Button variant="outline-secondary" size="sm">
            <FaArrowLeft />
          </Button>
        </LinkContainer>
        <div>
          <h1 className="fw-bold mb-0">
            {isEdit ? "Uredi Događaj" : "Novi Događaj"}
          </h1>
          {isEdit && <small className="text-muted">ID: {id}</small>}
        </div>
      </div>

      <Form onSubmit={submitHandler}>
        <Row className="g-4">
          {/* ── LEVA KOLONA ───────────────────────────────────────── */}
          <Col lg={8}>
            {/* OSNOVNE INFO */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaCalendarAlt className="me-2 text-success" />
                Osnovne informacije
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Naziv događaja *
                  </Form.Label>
                  <Form.Control
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Unesite naziv..."
                    size="lg"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Kategorija *</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label className="fw-semibold">Opis *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opišite događaj..."
                    required
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* SLIKA DOGAĐAJA */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaImage className="me-2 text-success" />
                Pozadinska slika događaja
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-muted small mb-3">
                  Prikazuje se na listi događaja i stranici detalja.
                </p>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">URL slike *</Form.Label>
                  <Form.Control
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/slika.jpg"
                    required
                  />
                </Form.Group>
                <ImagePreview
                  src={imagePreview}
                  label="Pregled pozadinske slike"
                />
              </Card.Body>
            </Card>

            {/* SLIKA ZA KARTU */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaTicketAlt className="me-2 text-success" />
                Slika na PDF karti
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-muted small mb-3">
                  Prikazuje se na PDF karti pri kupovini. Preporučena veličina:
                  1200×400px.
                </p>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    URL slike za kartu
                  </Form.Label>
                  <Form.Control
                    value={ticketImage}
                    onChange={(e) => {
                      setTicketImage(e.target.value);
                      setTicketImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/karta-banner.jpg"
                  />
                  <Form.Text className="text-muted">
                    Opcionalno — ako nije postavljeno, koristiće se pozadinska
                    slika
                  </Form.Text>
                </Form.Group>
                <ImagePreview
                  src={ticketImagePreview}
                  label="Pregled slike za kartu"
                />
              </Card.Body>
            </Card>

            {/* LOKACIJA */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaMapMarkerAlt className="me-2 text-success" />
                Lokacija
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Naziv mesta *
                      </Form.Label>
                      <Form.Control
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="Arena, Dom kulture..."
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Grad *</Form.Label>
                      <Form.Control
                        value={venueCity}
                        onChange={(e) => setVenueCity(e.target.value)}
                        placeholder="Beograd, Novi Sad..."
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Zemlja</Form.Label>
                      <Form.Control
                        value={venueCountry}
                        onChange={(e) => setVenueCountry(e.target.value)}
                        placeholder="Srbija"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Adresa</Form.Label>
                      <Form.Control
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="Ulica i broj"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* VRSTE KARATA */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom d-flex align-items-center justify-content-between py-3">
                <span className="fw-semibold">
                  <FaTicketAlt className="me-2 text-success" />
                  Vrste karata
                </span>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={addTicketType}
                  type="button"
                >
                  <FaPlus className="me-1" /> Dodaj vrstu
                </Button>
              </Card.Header>
              <Card.Body className="p-4">
                {ticketTypes.map((ticket, idx) => (
                  <TicketTypeRow
                    key={idx}
                    ticket={ticket}
                    idx={idx}
                    total={ticketTypes.length}
                    onChange={(field, value) =>
                      updateTicketType(idx, field, value)
                    }
                    onRemove={() => removeTicketType(idx)}
                  />
                ))}
              </Card.Body>
            </Card>
          </Col>

          {/* ── DESNA KOLONA ──────────────────────────────────────── */}
          <Col lg={4}>
            {/* DATUM I VREME */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaClock className="me-2 text-success" />
                Datum i vreme
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    {multiDay ? "Datum početka *" : "Datum *"}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Check
                  type="switch"
                  id="multi-day-switch"
                  label="Višednevni događaj"
                  checked={multiDay}
                  onChange={(e) => {
                    setMultiDay(e.target.checked);
                    if (!e.target.checked) setEndDate(startDate);
                  }}
                  className="mb-3"
                />
                {multiDay && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Datum završetka *
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                )}
                <Form.Group>
                  <Form.Label className="fw-semibold">Vreme *</Form.Label>
                  <Form.Control
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* PODEŠAVANJA */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaToggleOn className="me-2 text-success" />
                Podešavanja
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Check
                  type="switch"
                  id="isActive-switch"
                  label={
                    <span>
                      Aktivan{" "}
                      <Badge
                        bg={isActive ? "success" : "secondary"}
                        className="ms-1"
                      >
                        {isActive ? "DA" : "NE"}
                      </Badge>
                    </span>
                  }
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              </Card.Body>
            </Card>

            {/* SALA */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom fw-semibold py-3">
                <FaChair className="me-2 text-success" />
                Sala / Mapa sedišta
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Check
                  type="switch"
                  id="hasSeatMap-switch"
                  label={
                    <span>
                      Koristi mapu sedišta{" "}
                      <Badge
                        bg={hasSeatMap ? "success" : "secondary"}
                        className="ms-1"
                      >
                        {hasSeatMap ? "DA" : "NE"}
                      </Badge>
                    </span>
                  }
                  checked={hasSeatMap}
                  onChange={(e) => setHasSeatMap(e.target.checked)}
                  className="mb-3"
                />

                {sectionTemplates?.length > 0 ? (
                  <>
                    <Form.Label className="fw-semibold small">
                      Izaberi šablon sale
                    </Form.Label>

                    {/* Trenutna sala ako postoji */}
                    {isEdit && currentVenueLayout?.sections?.length > 0 && (
                      <div
                        style={{
                          background: "#f0f9ff",
                          border: "1px solid #93c5fd",
                          borderRadius: 6,
                          padding: "6px 10px",
                          marginBottom: 8,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#1d4ed8" }}>
                          Trenutna sala:{" "}
                        </span>
                        <span style={{ color: "#374151" }}>
                          {currentVenueLayout.sections
                            .map((s) => s.name)
                            .join(", ")}
                        </span>
                        <span style={{ color: "#64748b", marginLeft: 6 }}>
                          (
                          {currentVenueLayout.sections
                            .reduce(
                              (a, s) =>
                                a +
                                (s.sectorType === "standing"
                                  ? s.capacity
                                  : s.rowCount * s.seatsPerRow),
                              0,
                            )
                            .toLocaleString()}{" "}
                          mesta)
                        </span>
                      </div>
                    )}

                    <Form.Select
                      size="sm"
                      value={selectedTemplateId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTemplateId(val);
                        if (val) {
                          const tpl = sectionTemplates.find(
                            (t) => t._id === val,
                          );
                          if (tpl) applyTemplateToTicketTypes(tpl);
                        }
                      }}
                      className="mb-2"
                    >
                      <option value="">-- Izaberi šablon --</option>
                      {sectionTemplates.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} · {t.totalCapacity?.toLocaleString()} mesta ·{" "}
                          {t.sectionCount} sekcija
                        </option>
                      ))}
                    </Form.Select>

                    {selectedTemplate && (
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #86efac",
                          borderRadius: 8,
                          padding: "10px 14px",
                          marginBottom: 8,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#166534",
                            margin: "0 0 6px",
                            textTransform: "uppercase",
                          }}
                        >
                          Sekcije šablona
                        </p>
                        {selectedTemplate.sections?.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ color: "#374151" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: s.color,
                                  marginRight: 5,
                                }}
                              />
                              {s.name}
                              <Badge
                                bg={
                                  s.sectorType === "standing"
                                    ? "warning"
                                    : "primary"
                                }
                                style={{ fontSize: 9, marginLeft: 4 }}
                              >
                                {s.sectorType === "standing" ? "GA" : "💺"}
                              </Badge>
                            </span>
                            <span style={{ color: "#0f766e", fontWeight: 600 }}>
                              {(s.sectorType === "standing"
                                ? s.capacity
                                : s.rowCount * s.seatsPerRow
                              ).toLocaleString()}{" "}
                              mesta
                            </span>
                          </div>
                        ))}
                        <div
                          style={{
                            borderTop: "1px solid #86efac",
                            marginTop: 6,
                            paddingTop: 4,
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <span>Ukupno</span>
                          <span style={{ color: "#0f766e" }}>
                            {selectedTemplate.totalCapacity?.toLocaleString()}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#16a34a",
                            margin: "6px 0 0",
                          }}
                        >
                          ✓ Vrste karata su automatski popunjene — unesite cene
                          ispod
                        </p>
                      </div>
                    )}

                    {isEdit && selectedTemplateId && (
                      <Button
                        type="button"
                        variant="outline-success"
                        size="sm"
                        className="w-100 mb-2"
                        onClick={() => handleApplyTemplate()}
                        disabled={applyingTemplate}
                      >
                        {applyingTemplate
                          ? "Primenjuje se..."
                          : "🗺 Primeni mapu sedišta na događaj"}
                      </Button>
                    )}

                    <Form.Text className="text-muted d-block">
                      Šablon definiše raspored sekcija. Cene se unose za svaku
                      vrstu karte ispod.
                    </Form.Text>
                  </>
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <p className="text-muted small mb-2">
                      Nema sačuvanih šablona sala.
                    </p>
                    <a
                      href="/admin/venue-templates"
                      target="_blank"
                      rel="noreferrer"
                      className="small"
                    >
                      → Upravljaj šablonima
                    </a>
                  </div>
                )}

                {isEdit && (
                  <div className="mt-3">
                    <LinkContainer to={`/admin/venue/${id}`}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100"
                      >
                        <FaChair className="me-1" /> Otvori dizajner sale
                      </Button>
                    </LinkContainer>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* SAČUVAJ */}
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-grid gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    disabled={isSaving}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <FaSave />
                    {isSaving
                      ? "Čuvanje..."
                      : isEdit
                        ? "Sačuvaj izmene"
                        : "Kreiraj događaj"}
                  </Button>
                  <LinkContainer to="/admin/events">
                    <Button variant="outline-secondary">Odustani</Button>
                  </LinkContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default AdminEventEditScreen;
