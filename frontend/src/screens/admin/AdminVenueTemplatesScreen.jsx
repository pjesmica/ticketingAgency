import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaLayerGroup, FaTrash, FaChair, FaRunning, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
    useGetVenueSectionTemplatesQuery,
    useDeleteVenueSectionTemplateMutation,
    useUpdateVenueSectionTemplateMutation,
} from '../../slices/venueSectionTemplateApiSlice';

const sectionCapacity = s =>
    s.sectorType === 'standing' ? (s.capacity || 0) : (s.rowCount || 0) * (s.seatsPerRow || 0);

export default function AdminVenueTemplatesScreen() {
    const navigate = useNavigate();

    const { data: templates, isLoading, error } = useGetVenueSectionTemplatesQuery();
    const [deleteTemplate, { isLoading: deleting }] = useDeleteVenueSectionTemplateMutation();
    const [updateTemplate, { isLoading: updating }] = useUpdateVenueSectionTemplateMutation();

    const [confirmDelete, setConfirmDelete] = useState(null); // template object
    const [editModal,     setEditModal]     = useState(null); // template object
    const [editName,      setEditName]      = useState('');
    const [editDesc,      setEditDesc]      = useState('');

    const handleDelete = async () => {
        try {
            await deleteTemplate(confirmDelete._id).unwrap();
            toast.success('Šablon obrisan');
            setConfirmDelete(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Greška pri brisanju');
        }
    };

    const openEdit = (t) => {
        setEditModal(t);
        setEditName(t.name);
        setEditDesc(t.description || '');
    };

    const handleUpdate = async () => {
        if (!editName.trim()) { toast.error('Naziv je obavezan'); return; }
        try {
            await updateTemplate({ id: editModal._id, name: editName.trim(), description: editDesc.trim() }).unwrap();
            toast.success('Šablon ažuriran');
            setEditModal(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Greška pri ažuriranju');
        }
    };

    if (isLoading) return (
        <Container className="py-5 text-center"><Spinner animation="border" variant="success" /></Container>
    );
    if (error) return (
        <Container className="py-5"><Alert variant="danger">Greška pri učitavanju šablona.</Alert></Container>
    );

    return (
        <Container className="py-4" style={{ maxWidth: 900 }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="mb-0 fw-bold">
                        <FaLayerGroup className="me-2 text-warning" />
                        Šabloni sala
                    </h4>
                    <p className="text-muted small mb-0">
                        Sačuvani rasporedi sekcija koje možeš primeniti pri kreiranju događaja
                    </p>
                </div>
                <Badge bg="secondary" className="fs-6">{templates?.length || 0} šablona</Badge>
            </div>

            {!templates?.length ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <FaLayerGroup style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }} />
                        <h5 className="text-muted">Nema sačuvanih šablona</h5>
                        <p className="text-muted small">
                            U dizajneru sale klikni dugme <strong>Šablon</strong> da sačuvaš raspored.
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-3">
                    {templates.map(t => (
                        <Col md={6} key={t._id}>
                            <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 className="fw-bold mb-0">{t.name}</h6>
                                            {t.description && (
                                                <p className="text-muted small mb-0">{t.description}</p>
                                            )}
                                        </div>
                                        <div className="d-flex gap-1">
                                            <Button variant="outline-secondary" size="sm" onClick={() => openEdit(t)} title="Preimenuj">
                                                <FaEdit />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => setConfirmDelete(t)} title="Obriši">
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="d-flex gap-2 mb-2 flex-wrap">
                                        <Badge bg="success">{t.totalCapacity?.toLocaleString()} mesta</Badge>
                                        <Badge bg="secondary">{t.sectionCount} sekcija</Badge>
                                        <Badge bg="light" text="dark" style={{ fontSize: 10 }}>
                                            {new Date(t.createdAt).toLocaleDateString('sr-RS')}
                                        </Badge>
                                        {t.createdBy?.name && (
                                            <Badge bg="light" text="dark" style={{ fontSize: 10 }}>
                                                {t.createdBy.name}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Section preview */}
                                    {t.sections?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {t.sections.map((s, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                                    borderRadius: 5, padding: '2px 7px', fontSize: 11,
                                                }}>
                                                    <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color }} />
                                                    {s.name}
                                                    <span style={{ color: '#94a3b8' }}>
                                                        {s.sectorType === 'standing'
                                                            ? <FaRunning style={{ fontSize: 9 }} />
                                                            : <FaChair style={{ fontSize: 9 }} />}
                                                        {sectionCapacity(s).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ── Delete confirm modal ── */}
            <Modal show={!!confirmDelete} onHide={() => setConfirmDelete(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 16 }}>Obriši šablon</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Jesi li siguran da želiš da obrišeš šablon <strong>{confirmDelete?.name}</strong>?
                    <br />
                    <span className="text-muted small">Ovo ne utiče na događaje na koje je šablon već primenjen.</span>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setConfirmDelete(null)}>Otkaži</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Spinner size="sm" /> : 'Obriši'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Edit modal ── */}
            <Modal show={!!editModal} onHide={() => setEditModal(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 16 }}>Uredi šablon</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Naziv</Form.Label>
                        <Form.Control value={editName} onChange={e => setEditName(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Opis</Form.Label>
                        <Form.Control as="textarea" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setEditModal(null)}>Otkaži</Button>
                    <Button variant="success" onClick={handleUpdate} disabled={updating}>
                        {updating ? <Spinner size="sm" /> : 'Sačuvaj'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}