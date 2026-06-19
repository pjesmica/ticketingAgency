import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Row, Col, Button, Card, Form,
    Badge, Alert, Spinner, Modal, Nav,
} from 'react-bootstrap';
import {
    FaArrowLeft, FaSave, FaTrash, FaTheaterMasks, FaFont,
    FaUndo, FaRedo, FaPlus, FaMinus, FaEye, FaLayerGroup,
    FaChair, FaRunning, FaDoorOpen, FaCopy, FaCheck,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetEventDetailsQuery } from '../../slices/eventsApiSlice';
import { useGetVenueSectionsQuery, useSaveVenueSectionsMutation } from '../../slices/venueSectionApiSlice';
import { useCreateVenueSectionTemplateMutation } from '../../slices/venueSectionTemplateApiSlice';

// ─── Canvas constants ─────────────────────────────────────────────────────────
const CW   = 1200;
const CH   = 800;
const GRID = 20;

const snap = v => Math.round(v / GRID) * GRID;
const uid  = () => Math.random().toString(36).slice(2, 9);

const PALETTE = [
    '#3b82f6','#f59e0b','#8b5cf6','#10b981',
    '#ef4444','#06b6d4','#f97316','#84cc16',
    '#ec4899','#6b7280',
];

const sectionCapacity = s =>
    s.sectorType === 'standing' ? (s.capacity || 0) : (s.rowCount || 0) * (s.seatsPerRow || 0);

const makeSection = (x, y, ticketType) => ({
    _localId:       uid(),
    name:           'Nova sekcija',
    sectorType:     'seated',
    x: snap(x), y: snap(y),
    width: 200, height: 140,
    angle: 0, shape: 'rect',
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    rowCount:    10,
    seatsPerRow: 20,
    rowStart:    'A',
    seatStart:   1,
    rowLabels:   [],
    capacity:    200,
    ticketTypeId:   ticketType?._id   || '',
    ticketTypeName: ticketType?.name  || '',
    price:          ticketType?.price || 0,
});

const makeDecoration = (type, x, y) => ({
    _localId: uid(),
    type,
    x: snap(x), y: snap(y),
    width:  type === 'stage' ? 300 : 80,
    height: type === 'stage' ? 60  : 40,
    label:  type === 'stage' ? 'BINA' : type === 'entrance' ? 'ULAZ' : 'Tekst',
    color:  type === 'stage' ? '#1f2937' : type === 'entrance' ? '#065f46' : '#374151',
    angle: 0,
    fontSize: type === 'stage' ? 18 : 13,
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminVenueBuilderScreen() {
    const { id: eventId } = useParams();
    const navigate        = useNavigate();
    const isStandalone    = !eventId; // /admin/venue bez događaja — samo šablon

    const { data: event,       isLoading: loadingEvent  } = useGetEventDetailsQuery(eventId, { skip: !eventId });
    const { data: savedLayout, isLoading: loadingLayout } = useGetVenueSectionsQuery(eventId, { skip: !eventId });
    const [saveLayout, { isLoading: saving }] = useSaveVenueSectionsMutation();
    const [createTemplate, { isLoading: savingTemplate }] = useCreateVenueSectionTemplateMutation();

    const [sections,      setSections]      = useState([]);
    const [decorations,   setDecorations]   = useState([]);
    const [selectedId,    setSelectedId]    = useState(null);
    const [history,       setHistory]       = useState([]);
    const [future,        setFuture]        = useState([]);
    const [zoom,          setZoom]          = useState(1);
    const [tool,          setTool]          = useState('select');
    const [activeTab,     setActiveTab]     = useState('layout');
    const [showSaveModal,     setShowSaveModal]     = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName,      setTemplateName]      = useState('');
    const [templateDesc,      setTemplateDesc]      = useState('');

    const dragging  = useRef(null);
    const resizing  = useRef(null);
    const canvasRef = useRef(null);

    // ── Load saved layout ──
    useEffect(() => {
        if (!savedLayout) return;
        const toLocal = arr => (arr || []).map(item => ({ ...item, _localId: item._id || uid() }));
        setSections(toLocal(savedLayout.sections));
        setDecorations(toLocal(savedLayout.decorations));
    }, [savedLayout]);

    const defaultTT = event?.ticketTypes?.[0];

    // ── History helpers ──
    const getSnap = useCallback(() => ({ sections, decorations }), [sections, decorations]);

    const pushHistory = useCallback(() => {
        setHistory(h => [...h.slice(-40), { sections, decorations }]);
        setFuture([]);
    }, [sections, decorations]);

    const undo = useCallback(() => {
        if (!history.length) return;
        const prev = history[history.length - 1];
        setFuture(f => [{ sections, decorations }, ...f]);
        setSections(prev.sections);
        setDecorations(prev.decorations);
        setHistory(h => h.slice(0, -1));
    }, [history, sections, decorations]);

    const redo = useCallback(() => {
        if (!future.length) return;
        setHistory(h => [...h, { sections, decorations }]);
        setSections(future[0].sections);
        setDecorations(future[0].decorations);
        setFuture(f => f.slice(1));
    }, [future, sections, decorations]);

    // ── Ctrl+Scroll zoom ──
    useEffect(() => {
        const el = canvasRef.current?.parentElement;
        if (!el) return;
        const h = e => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const d = e.deltaY < 0 ? 0.1 : -0.1;
            setZoom(z => Math.min(2, Math.max(0.25, parseFloat((z + d).toFixed(2)))));
        };
        el.addEventListener('wheel', h, { passive: false });
        return () => el.removeEventListener('wheel', h);
    }, []);

    // ── Keyboard shortcuts ──
    const deleteSelected = useCallback(() => {
        if (!selectedId) return;
        pushHistory();
        setSections(prev => prev.filter(s => s._localId !== selectedId));
        setDecorations(prev => prev.filter(d => d._localId !== selectedId));
        setSelectedId(null);
    }, [selectedId, pushHistory]);

    const duplicateSelected = useCallback(() => {
        if (!selectedId) return;
        pushHistory();
        const sec = sections.find(s => s._localId === selectedId);
        if (sec) {
            const copy = { ...sec, _localId: uid(), x: sec.x + GRID * 2, y: sec.y + GRID * 2 };
            setSections(prev => [...prev, copy]);
            setSelectedId(copy._localId);
        }
        const dec = decorations.find(d => d._localId === selectedId);
        if (dec) {
            const copy = { ...dec, _localId: uid(), x: dec.x + GRID * 2, y: dec.y + GRID * 2 };
            setDecorations(prev => [...prev, copy]);
            setSelectedId(copy._localId);
        }
    }, [selectedId, sections, decorations, pushHistory]);

    useEffect(() => {
        const h = e => {
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)) return;
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z')  { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y')  { e.preventDefault(); redo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd')  { e.preventDefault(); duplicateSelected(); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [deleteSelected, duplicateSelected, undo, redo]);

    // ── Coordinate conversion ──
    const toCanvas = (cx, cy) => {
        const r = canvasRef.current.getBoundingClientRect();
        return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom };
    };

    // ── Canvas click (place objects) ──
    const handleCanvasClick = e => {
        if (tool === 'select') return; // selekcija se upravlja u onObjMouseDown/onMouseUp
        const { x, y } = toCanvas(e.clientX, e.clientY);
        pushHistory();
        if (tool === 'section') {
            const s = makeSection(x - 100, y - 70, defaultTT);
            setSections(prev => [...prev, s]);
            setSelectedId(s._localId);
            setTool('select');
            setActiveTab('configure');
        } else {
            const d = makeDecoration(tool, x - 60, y - 20);
            setDecorations(prev => [...prev, d]);
            setSelectedId(d._localId);
            setTool('select');
        }
    };

    // ── Drag & resize ──
    const onObjMouseDown = (e, id, isSection) => {
        if (tool !== 'select') return;
        e.stopPropagation();
        mouseDownOnObject.current = true;
        setSelectedId(id);
        const items = isSection ? sections : decorations;
        const obj   = items.find(o => o._localId === id);
        const { x, y } = toCanvas(e.clientX, e.clientY);
        dragging.current = {
            id, isSection,
            offX: x - obj.x, offY: y - obj.y,
            hasMoved: false,     // ← track whether mouse actually moved
            startX: e.clientX, startY: e.clientY,
        };
    };

    // ── Deselektuj kad klikneš na prazan deo canvasa ──
    const mouseDownOnObject = useRef(false);

    const onCanvasMouseDown = e => {
        if (tool !== 'select') return;
        if (!mouseDownOnObject.current) {
            setSelectedId(null);
        }
        mouseDownOnObject.current = false;
    };

    const onResizeMouseDown = (e, id, isSection, edge) => {
        e.stopPropagation();
        mouseDownOnObject.current = true;
        const items = isSection ? sections : decorations;
        const obj   = items.find(o => o._localId === id);
        resizing.current = {
            id, isSection, edge,
            startX: e.clientX, startY: e.clientY,
            origX: obj.x, origY: obj.y,
            origW: obj.width, origH: obj.height,
        };
    };

    const onMouseMove = e => {
        if (dragging.current) {
            const { id, isSection, offX, offY, startX, startY } = dragging.current;

            // Threshold: 4px before we treat it as a real drag
            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
            if (dist < 4) return;

            dragging.current.hasMoved = true;

            const { x, y } = toCanvas(e.clientX, e.clientY);
            const nx = Math.max(0, Math.min(CW - 40, snap(x - offX)));
            const ny = Math.max(0, Math.min(CH - 40, snap(y - offY)));
            const upd = arr => arr.map(o => o._localId === id ? { ...o, x: nx, y: ny } : o);
            if (isSection) setSections(upd); else setDecorations(upd);
        }
        if (resizing.current) {
            const { id, isSection, edge, startX, startY, origX, origY, origW, origH } = resizing.current;
            const dx = (e.clientX - startX) / zoom;
            const dy = (e.clientY - startY) / zoom;
            const upd = arr => arr.map(o => {
                if (o._localId !== id) return o;
                let { x, y, width, height } = o;
                if (edge.includes('e')) width  = Math.max(GRID * 3, snap(origW + dx));
                if (edge.includes('s')) height = Math.max(GRID * 2, snap(origH + dy));
                if (edge.includes('w')) { width  = Math.max(GRID * 3, snap(origW - dx)); x = snap(origX + dx); }
                if (edge.includes('n')) { height = Math.max(GRID * 2, snap(origH - dy)); y = snap(origY + dy); }
                return { ...o, x, y, width, height };
            });
            if (isSection) setSections(upd); else setDecorations(upd);
        }
    };

    const onMouseUp = () => {
        if (resizing.current) {
            pushHistory();
        } else if (dragging.current) {
            if (dragging.current.hasMoved) {
                // Real drag — save history
                pushHistory();
            } else {
                // Pure click — open configure tab for this object
                setActiveTab('configure');
            }
        }
        dragging.current = null;
        resizing.current = null;
    };

    // ── Update helpers ──
    const updateSection = (field, value) =>
        setSections(prev => prev.map(s => s._localId === selectedId ? { ...s, [field]: value } : s));

    const updateDecoration = (field, value) =>
        setDecorations(prev => prev.map(d => d._localId === selectedId ? { ...d, [field]: value } : d));

    const selectedSection    = sections.find(s => s._localId === selectedId);
    const selectedDecoration = decorations.find(d => d._localId === selectedId);

    // ── Save ──
    const handleSave = async () => {
        if (!sections.length) { toast.warning('Dodajte bar jednu sekciju'); return; }
        if (!isStandalone) {
            const invalid = sections.find(s => !s.ticketTypeId);
            if (invalid) {
                toast.error(`Sekcija "${invalid.name}" nema izabran tip karte`);
                setSelectedId(invalid._localId); setActiveTab('configure'); return;
            }
        }
        try {
            const clean = arr => arr.map(({ _localId, _id, ...rest }) => rest);
            const res = await saveLayout({
                eventId,
                sections:    clean(sections),
                decorations: clean(decorations),
            }).unwrap();
            toast.success(res.message || 'Sala sačuvana!');
            setShowSaveModal(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Greška pri čuvanju');
        }
    };

    // ── Save as template ──
    const handleSaveTemplate = async () => {
        if (!templateName.trim()) { toast.error('Unesite naziv šablona'); return; }
        if (!sections.length) { toast.warning('Nema sekcija za čuvanje'); return; }
        try {
            const clean = arr => arr.map(({ _localId, _id, ...rest }) => rest);
            const cleanedSections = clean(sections);
            console.log('Čuvanje šablona — sekcije:', cleanedSections.map(s => ({
                name: s.name,
                blockedSeats: s.blockedSeats,
                blockedCount: s.blockedSeats?.length || 0,
            })));
            await createTemplate({
                name:        templateName.trim(),
                description: templateDesc.trim(),
                sections:    cleanedSections,
                decorations: clean(decorations),
            }).unwrap();
            toast.success(`Šablon "${templateName}" sačuvan!`);
            setShowTemplateModal(false);
            setTemplateName('');
            setTemplateDesc('');
            if (isStandalone) navigate('/admin/venue-templates');
        } catch (err) {
            toast.error(err?.data?.message || 'Greška pri čuvanju šablona');
        }
    };

    // ── Stats ──
    const totalCapacity = sections.reduce((sum, s) => sum + sectionCapacity(s), 0);

    if (!isStandalone && (loadingEvent || loadingLayout))
        return <Container className="py-5 text-center"><Spinner animation="border" variant="success" /></Container>;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f4f8' }}>

            {/* ── Top bar ── */}
            <div style={{
                background: '#1e293b', color: '#fff',
                padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10, flexShrink: 0,
            }}>
                <Button variant="outline-light" size="sm"
                    onClick={() => navigate(isStandalone ? '/admin/venue-templates' : '/admin/events')}>
                    <FaArrowLeft />
                </Button>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                        <FaTheaterMasks style={{ marginRight: 6, color: '#34d399' }} />
                        Dizajner sale
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {isStandalone ? 'Novi šablon' : (event?.name || '...')}
                    </div>
                </div>

                <div style={{ flex: 1 }} />

                <Badge bg="secondary" style={{ fontSize: 12 }}>
                    {sections.length} sekcija · {totalCapacity.toLocaleString()} mesta
                </Badge>

                {/* Zoom control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#334155', borderRadius: 6, padding: '2px 8px' }}>
                    <button onClick={() => setZoom(z => Math.max(0.25, parseFloat((z-0.1).toFixed(2))))}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px', fontSize: 12 }}>−</button>
                    <span onClick={() => setZoom(1)}
                        style={{ fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'center', cursor: 'pointer', color: '#e2e8f0' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={() => setZoom(z => Math.min(2, parseFloat((z+0.1).toFixed(2))))}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px', fontSize: 12 }}>+</button>
                </div>

                <Button variant="outline-light" size="sm" onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)"><FaUndo /></Button>
                <Button variant="outline-light" size="sm" onClick={redo} disabled={!future.length}  title="Redo (Ctrl+Y)"><FaRedo /></Button>
                {selectedId && (
                    <Button variant="outline-light" size="sm" onClick={duplicateSelected} title="Dupliraj (Ctrl+D)"><FaCopy /></Button>
                )}

                <Button variant="outline-warning" size="sm"
                    onClick={() => setShowTemplateModal(true)}
                    disabled={!sections.length}
                    title="Sačuvaj kao šablon sale"
                >
                    <FaLayerGroup style={{ marginRight: 4 }} />
                    {isStandalone ? 'Sačuvaj šablon' : 'Šablon'}
                </Button>

                {!isStandalone && (
                    <Button variant="success" size="sm" onClick={() => setShowSaveModal(true)} disabled={saving}>
                        {saving ? <Spinner size="sm" /> : <><FaSave style={{ marginRight: 4 }} />Sačuvaj & Generiši</>}
                    </Button>
                )}
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Left sidebar ── */}
                <div style={{
                    width: 270, background: '#fff', borderRight: '1px solid #e2e8f0',
                    overflowY: 'auto', display: 'flex', flexDirection: 'column', flexShrink: 0,
                }}>
                    {/* Tab selector */}
                    <div style={{ padding: '10px 10px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                            {[
                                { key: 'layout',    label: 'Layout' },
                                { key: 'configure', label: 'Konfiguriši' },
                                { key: 'seats',     label: 'Sedišta' },
                            ].map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    style={{
                                        flex: 1, padding: '6px 0', border: 'none', background: 'none',
                                        borderBottom: activeTab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
                                        color: activeTab === t.key ? '#1d4ed8' : '#64748b',
                                        fontWeight: activeTab === t.key ? 700 : 400,
                                        fontSize: 13, cursor: 'pointer',
                                    }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: 12, flex: 1 }}>

                        {/* ── LAYOUT TAB ── */}
                        {activeTab === 'layout' && (
                            <>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '6px 0' }}>Alatke</p>

                                {[
                                    { id: 'select',   icon: <FaEye />,         label: 'Selektuj / Pomeri',  desc: 'Klikni ili prevuci' },
                                    { id: 'section',  icon: <FaChair />,        label: 'Nova sekcija',       desc: 'Klikni na platno' },
                                    { id: 'stage',    icon: <FaTheaterMasks />, label: 'Bina / Scena',       desc: 'Klikni na platno' },
                                    { id: 'entrance', icon: <FaDoorOpen />,     label: 'Ulaz / Izlaz',       desc: 'Klikni na platno' },
                                    { id: 'label',    icon: <FaFont />,         label: 'Tekst oznaka',       desc: 'Klikni na platno' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => setTool(t.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            width: '100%', padding: '7px 10px', marginBottom: 3,
                                            borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'left',
                                            background: tool === t.id ? '#eff6ff' : 'transparent',
                                            color: tool === t.id ? '#1d4ed8' : '#374151',
                                            fontWeight: tool === t.id ? 700 : 400,
                                        }}
                                    >
                                        <span style={{ width: 16, flexShrink: 0, color: tool === t.id ? '#3b82f6' : '#9ca3af' }}>{t.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 13 }}>{t.label}</div>
                                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{t.desc}</div>
                                        </div>
                                    </button>
                                ))}

                                <hr style={{ margin: '12px 0' }} />
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px' }}>
                                    Sekcije ({sections.length})
                                </p>

                                {sections.length === 0 && (
                                    <p style={{ fontSize: 12, color: '#9ca3af', padding: '4px 0' }}>
                                        Nema sekcija. Izaberi "Nova sekcija" i klikni na platno.
                                    </p>
                                )}

                                {sections.map(s => (
                                    <button key={s._localId}
                                        onClick={() => { setSelectedId(s._localId); setActiveTab('configure'); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            width: '100%', padding: '6px 8px', marginBottom: 3,
                                            borderRadius: 6, textAlign: 'left', cursor: 'pointer',
                                            border: selectedId === s._localId ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                            background: selectedId === s._localId ? '#eff6ff' : '#fafafa',
                                        }}
                                    >
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.name}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>
                                                {s.sectorType === 'standing'
                                                    ? `GA · ${s.capacity} mesta`
                                                    : `${s.rowCount}r × ${s.seatsPerRow}m = ${sectionCapacity(s).toLocaleString()}`}
                                            </div>
                                        </div>
                                        <Badge bg={s.sectorType === 'standing' ? 'warning' : 'primary'} style={{ fontSize: 9 }}>
                                            {s.sectorType === 'standing' ? 'GA' : '💺'}
                                        </Badge>
                                    </button>
                                ))}

                                {sections.length > 0 && (
                                    <>
                                        <hr style={{ margin: '12px 0' }} />
                                        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px' }}>Kapacitet po sekcijama</p>
                                        {sections.map(s => (
                                            <div key={s._localId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                                                    <span style={{ fontSize: 11, color: '#374151' }}>{s.name}</span>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f766e' }}>
                                                    {sectionCapacity(s).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '2px solid #e2e8f0', marginTop: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700 }}>Ukupno</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f766e' }}>{totalCapacity.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* ── CONFIGURE TAB ── */}
                        {activeTab === 'configure' && (
                            <>
                                {!selectedSection && !selectedDecoration ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                                        <FaChair style={{ fontSize: 36, marginBottom: 12 }} />
                                        <p style={{ fontSize: 13 }}>Izaberi sekciju na mapi ili u listi</p>
                                    </div>
                                ) : selectedSection ? (
                                    <SectionConfigPanel
                                        section={selectedSection}
                                        event={event}
                                        update={updateSection}
                                        onDelete={deleteSelected}
                                        onDuplicate={duplicateSelected}
                                    />
                                ) : (
                                    <DecorationConfigPanel
                                        decoration={selectedDecoration}
                                        update={updateDecoration}
                                        onDelete={deleteSelected}
                                    />
                                )}
                            </>
                        )}

                        {/* ── SEATS TAB ── */}
                        {activeTab === 'seats' && (
                            <>
                                {!selectedSection ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                                        <FaChair style={{ fontSize: 36, marginBottom: 12 }} />
                                        <p style={{ fontSize: 13 }}>Izaberi sekciju pa otvori ovaj tab da blokiraš/odblokiraš konkretna mesta</p>
                                        <p style={{ fontSize: 11, color: '#cbd5e1' }}>Radi samo za "Sedišta" tip sekcije</p>
                                    </div>
                                ) : selectedSection.sectorType === 'standing' ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                                        <FaChair style={{ fontSize: 36, marginBottom: 12 }} />
                                        <p style={{ fontSize: 13 }}>GA zone nemaju individualna mesta</p>
                                        <p style={{ fontSize: 11 }}>Promeni kapacitet u "Konfiguriši" tabu</p>
                                    </div>
                                ) : (
                                    <SectionSeatBlocker
                                        section={selectedSection}
                                        onUpdate={(field, value) => {
                                            setSections(prev => prev.map(s =>
                                                s._localId === selectedSection._localId
                                                    ? { ...s, [field]: value }
                                                    : s
                                            ));
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Canvas ── */}
                <div style={{ flex: 1, overflow: 'auto', background: '#e8edf2', position: 'relative' }}>

                    {/* Hint bar */}
                    <div style={{
                        position: 'sticky', top: 0, zIndex: 4,
                        background: 'rgba(15,23,42,0.82)', color: '#cbd5e1',
                        padding: '5px 16px', fontSize: 11, textAlign: 'center',
                        backdropFilter: 'blur(4px)',
                    }}>
                        Prevuci sekciju da pomeriš · Ručke na uglovima za resize · <kbd style={{ background: '#334155', padding: '1px 4px', borderRadius: 3 }}>Ctrl+Scroll</kbd> zoom · <kbd style={{ background: '#334155', padding: '1px 4px', borderRadius: 3 }}>Del</kbd> briše · <kbd style={{ background: '#334155', padding: '1px 4px', borderRadius: 3 }}>Ctrl+D</kbd> dupliraj
                    </div>

                    <div style={{ padding: 24 }}>
                        {/* Size wrapper for proper scrollbar */}
                        <div style={{ width: CW * zoom, height: CH * zoom, position: 'relative' }}>
                            <div
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                onMouseDown={onCanvasMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={onMouseUp}
                                onMouseLeave={onMouseUp}
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: CW, height: CH,
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'top left',
                                    backgroundImage: `
                                        linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                                        linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
                                    `,
                                    backgroundSize: `${GRID}px ${GRID}px`,
                                    backgroundColor: '#f8fafc',
                                    cursor: tool === 'select' ? 'default' : 'crosshair',
                                    userSelect: 'none',
                                    borderRadius: 10,
                                    boxShadow: '0 4px 32px rgba(0,0,0,0.14)',
                                }}
                            >
                                {decorations.map(d => (
                                    <DecorationObject
                                        key={d._localId} dec={d}
                                        selected={selectedId === d._localId}
                                        tool={tool}
                                        onMouseDown={e => onObjMouseDown(e, d._localId, false)}
                                        onResizeMouseDown={(e, edge) => onResizeMouseDown(e, d._localId, false, edge)}
                                    />
                                ))}
                                {sections.map(s => (
                                    <SectionObject
                                        key={s._localId} section={s}
                                        selected={selectedId === s._localId}
                                        tool={tool}
                                        onMouseDown={e => { onObjMouseDown(e, s._localId, true); setActiveTab('configure'); }}
                                        onResizeMouseDown={(e, edge) => onResizeMouseDown(e, s._localId, true, edge)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Save modal ── */}
            <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered>
                <Modal.Header closeButton style={{ background: '#1e293b', color: '#fff' }}>
                    <Modal.Title style={{ fontSize: 16 }}>Potvrdi generisanje sedišta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning" className="py-2 mb-3" style={{ fontSize: 13 }}>
                        <strong>Pažnja:</strong> Sva postojeća sedišta za ovaj događaj biće obrisana i generisana ponovo na osnovu konfiguracije ispod.
                    </Alert>
                    {sections.map(s => (
                        <div key={s._localId} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '7px 10px', marginBottom: 4, borderRadius: 6,
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                                <Badge bg={s.sectorType === 'standing' ? 'warning' : 'primary'} style={{ fontSize: 10 }}>
                                    {s.sectorType === 'standing' ? 'GA zona' : 'Sedišta'}
                                </Badge>
                                <span style={{ fontSize: 11, color: '#64748b' }}>{s.ticketTypeName || '⚠ bez tipa'}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f766e', fontSize: 14 }}>
                                {sectionCapacity(s).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', fontWeight: 700, borderTop: '2px solid #e2e8f0', marginTop: 6, fontSize: 14 }}>
                        <span>Ukupno sedišta</span>
                        <span style={{ color: '#0f766e' }}>{totalCapacity.toLocaleString()}</span>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowSaveModal(false)}>Otkaži</Button>
                    <Button variant="success" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-1" /> : <FaCheck className="me-1" />}
                        Generiši {totalCapacity.toLocaleString()} sedišta
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Template modal ── */}
            <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} centered>
                <Modal.Header closeButton style={{ background: '#1e293b', color: '#fff' }}>
                    <Modal.Title style={{ fontSize: 16 }}>
                        <FaLayerGroup style={{ marginRight: 8, color: '#f59e0b' }} />
                        Sačuvaj kao šablon sale
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                        Šablon čuva raspored sekcija bez cena i tipova karata — možeš ga primeniti na bilo koji budući događaj.
                    </p>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Naziv šablona *</Form.Label>
                        <Form.Control
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder="npr. Velika sala — 2000 mesta"
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 13 }}>Opis (opciono)</Form.Label>
                        <Form.Control
                            as="textarea" rows={2}
                            value={templateDesc}
                            onChange={e => setTemplateDesc(e.target.value)}
                            placeholder="Kratki opis..."
                        />
                    </Form.Group>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 8px' }}>
                            Sekcije koje će biti sačuvane
                        </p>
                        {sections.map(s => (
                            <div key={s._localId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                                    <span style={{ fontSize: 12 }}>{s.name}</span>
                                    <Badge bg={s.sectorType === 'standing' ? 'warning' : 'primary'} style={{ fontSize: 9 }}>
                                        {s.sectorType === 'standing' ? 'GA' : '💺'}
                                    </Badge>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                                    {sectionCapacity(s).toLocaleString()} mesta
                                </span>
                            </div>
                        ))}
                        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>Ukupno</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f766e' }}>{totalCapacity.toLocaleString()} mesta</span>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowTemplateModal(false)}>Otkaži</Button>
                    <Button variant="warning" onClick={handleSaveTemplate} disabled={savingTemplate}>
                        {savingTemplate ? <Spinner size="sm" className="me-1" /> : <FaLayerGroup className="me-1" />}
                        Sačuvaj šablon
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

// ─── Section canvas object ────────────────────────────────────────────────────
function SectionObject({ section: s, selected, tool, onMouseDown, onResizeMouseDown }) {
    const isSelect = tool === 'select';
    const cap = sectionCapacity(s);
    const fontSize = Math.max(9, Math.min(14, s.width / 14));

    // Dot-matrix preview of rows × seats
    const dotsX = Math.min(s.seatsPerRow, Math.floor((s.width  - 16) / 6));
    const dotsY = Math.min(s.rowCount,    Math.floor((s.height - 40) / 6));
    const showDots = s.sectorType === 'seated' && dotsX >= 3 && dotsY >= 2;

    return (
        <div
            onMouseDown={isSelect ? onMouseDown : undefined}
            onClick={e => e.stopPropagation()}
            style={{
                position: 'absolute',
                left: s.x, top: s.y,
                width: s.width, height: s.height,
                background: s.color + '20',
                border: `2.5px ${s.sectorType === 'standing' ? 'dashed' : 'solid'} ${s.color}`,
                borderRadius: 8,
                cursor: isSelect ? 'move' : 'crosshair',
                userSelect: 'none',
                overflow: 'hidden',
                boxShadow: selected
                    ? `0 0 0 3px ${s.color}66, 0 4px 20px rgba(0,0,0,0.18)`
                    : '0 2px 6px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.12s',
            }}
        >
            {/* Dot-matrix seat preview */}
            {showDots && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 3, padding: '26px 6px 6px',
                    pointerEvents: 'none',
                }}>
                    {Array.from({ length: dotsY }, (_, r) => (
                        <div key={r} style={{ display: 'flex', gap: 3 }}>
                            {Array.from({ length: dotsX }, (_, c) => (
                                <div key={c} style={{ width: 3, height: 3, borderRadius: 1, background: s.color + '90' }} />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* GA zone fill */}
            {s.sectorType === 'standing' && (
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `repeating-linear-gradient(45deg, ${s.color}10 0, ${s.color}10 5px, transparent 5px, transparent 12px)`,
                }} />
            )}

            {/* Label */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '5px 8px',
                background: s.color + 'dd',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                pointerEvents: 'none',
            }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                </span>
                <span style={{ color: '#ffffffcc', fontSize: Math.max(8, fontSize - 1), whiteSpace: 'nowrap', marginLeft: 4 }}>
                    {cap.toLocaleString()} {s.sectorType === 'standing' ? 'GA' : '💺'}
                </span>
            </div>

            {/* Price tag */}
            {s.price > 0 && s.height > 60 && (
                <div style={{
                    position: 'absolute', bottom: 4, right: 6,
                    background: 'rgba(255,255,255,0.85)', borderRadius: 4,
                    padding: '1px 5px', fontSize: Math.max(8, fontSize - 2),
                    color: '#0f766e', fontWeight: 700, pointerEvents: 'none',
                }}>
                    {s.price.toLocaleString()} RSD
                </div>
            )}

            {/* Resize handles */}
            {selected && isSelect && ['ne','nw','se','sw'].map(edge => (
                <ResizeHandle key={edge} edge={edge} onMouseDown={e => onResizeMouseDown(e, edge)} />
            ))}
        </div>
    );
}

// ─── Decoration object ────────────────────────────────────────────────────────
function DecorationObject({ dec: d, selected, tool, onMouseDown, onResizeMouseDown }) {
    const isSelect = tool === 'select';
    const isStage  = d.type === 'stage';
    const isEntry  = d.type === 'entrance';

    return (
        <div
            onMouseDown={isSelect ? onMouseDown : undefined}
            onClick={e => e.stopPropagation()}
            style={{
                position: 'absolute', left: d.x, top: d.y,
                width: d.width, height: d.height,
                background: isStage ? d.color : isEntry ? '#d1fae5' : 'transparent',
                border: selected
                    ? '2.5px solid #3b82f6'
                    : isStage ? `2px solid ${d.color}`
                    : isEntry ? '2px solid #065f46'
                    : '1.5px dashed #94a3b8',
                borderRadius: isStage ? 8 : 6,
                cursor: isSelect ? 'move' : 'crosshair',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isStage ? '#fff' : isEntry ? '#065f46' : d.color,
                fontWeight: 700,
                fontSize: d.fontSize || 13,
                letterSpacing: isStage ? 4 : 0,
                userSelect: 'none',
                boxShadow: selected ? '0 0 0 2px #93c5fd' : isStage ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                gap: 5,
            }}
        >
            {isEntry && <FaDoorOpen />}
            {d.label}
            {selected && isSelect && ['ne','nw','se','sw'].map(edge => (
                <ResizeHandle key={edge} edge={edge} onMouseDown={e => onResizeMouseDown(e, edge)} />
            ))}
        </div>
    );
}

// ─── Resize handle ────────────────────────────────────────────────────────────
function ResizeHandle({ edge, onMouseDown }) {
    const pos = {
        ne: { top: -5, right: -5 }, nw: { top: -5, left: -5 },
        se: { bottom: -5, right: -5 }, sw: { bottom: -5, left: -5 },
    }[edge];
    return (
        <div
            onMouseDown={e => { e.stopPropagation(); onMouseDown(e); }}
            style={{
                position: 'absolute', ...pos,
                width: 10, height: 10,
                background: '#fff', border: '2px solid #3b82f6',
                borderRadius: 2, cursor: `${edge}-resize`, zIndex: 10,
            }}
        />
    );
}

// ─── Section config panel ─────────────────────────────────────────────────────
function SectionConfigPanel({ section: s, event, update, onDelete, onDuplicate }) {
    const cap = sectionCapacity(s);
    const label = (text) => (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 3 }}>{text}</div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Konfiguracija sekcije
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="outline-secondary" size="sm" onClick={onDuplicate} title="Dupliraj"><FaCopy /></Button>
                    <Button variant="outline-danger"    size="sm" onClick={onDelete}    title="Obriši"><FaTrash /></Button>
                </div>
            </div>

            {/* Naziv */}
            <div className="mb-2">
                {label('Naziv sekcije')}
                <Form.Control size="sm" value={s.name} onChange={e => update('name', e.target.value)} />
            </div>

            {/* Tip sekcije */}
            <div className="mb-2">
                {label('Tip sekcije')}
                <div style={{ display: 'flex', gap: 6 }}>
                    {[
                        { v: 'seated',   icon: <FaChair />,   text: 'Sedišta' },
                        { v: 'standing', icon: <FaRunning />, text: 'GA zona' },
                    ].map(o => (
                        <button key={o.v} onClick={() => update('sectorType', o.v)}
                            style={{
                                flex: 1, padding: '7px 4px', borderRadius: 6, cursor: 'pointer',
                                border: `2px solid ${s.sectorType === o.v ? '#3b82f6' : '#e2e8f0'}`,
                                background: s.sectorType === o.v ? '#eff6ff' : '#fafafa',
                                color: s.sectorType === o.v ? '#1d4ed8' : '#374151',
                                fontWeight: 600, fontSize: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            }}
                        >
                            {o.icon} {o.text}
                        </button>
                    ))}
                </div>
            </div>

            {/* Seated options */}
            {s.sectorType === 'seated' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                        <div>
                            {label('Broj redova')}
                            <Form.Control size="sm" type="text" inputMode="numeric"
                                value={s.rowCount}
                                onChange={e => {
                                    const v = e.target.value;
                                    update('rowCount', v === '' ? '' : Math.max(1, Number(v) || 1));
                                }} />
                        </div>
                        <div>
                            {label('Mesta po redu')}
                            <Form.Control size="sm" type="text" inputMode="numeric"
                                value={s.seatsPerRow}
                                onChange={e => {
                                    const v = e.target.value;
                                    update('seatsPerRow', v === '' ? '' : Math.max(1, Number(v) || 1));
                                }} />
                        </div>
                        <div>
                            {label('Prva oznaka reda')}
                            <Form.Control size="sm" value={s.rowStart}
                                onChange={e => update('rowStart', e.target.value.toUpperCase().slice(0, 3))}
                                placeholder="A ili 1" />
                        </div>
                        <div>
                            {label('Poč. broj mesta')}
                            <Form.Control size="sm" type="text" inputMode="numeric"
                                value={s.seatStart}
                                onChange={e => {
                                    const v = e.target.value;
                                    update('seatStart', v === '' ? '' : Math.max(0, Number(v) || 0));
                                }} />
                        </div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 10px', marginBottom: 8, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                        {s.rowCount} redova × {s.seatsPerRow} mesta = <strong>{cap.toLocaleString()} sedišta</strong>
                    </div>
                </>
            )}

            {/* GA options */}
            {s.sectorType === 'standing' && (
                <div className="mb-2">
                    {label('Kapacitet (broj karata)')}
                    <Form.Control size="sm" type="text" inputMode="numeric"
                        value={s.capacity}
                        onChange={e => {
                            const v = e.target.value;
                            update('capacity', v === '' ? '' : Math.max(1, Number(v) || 1));
                        }} />
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                        Nema numerisanih mesta — kupci biraju broj karata
                    </div>
                </div>
            )}

            <hr style={{ margin: '10px 0' }} />

            {/* Tip karte */}
            <div className="mb-2">
                {label('Tip karte')}
                {event?.ticketTypes?.length ? (
                    <Form.Select size="sm" value={s.ticketTypeId}
                        onChange={e => {
                            const tt = event.ticketTypes.find(t => t._id === e.target.value);
                            update('ticketTypeId',   e.target.value);
                            update('ticketTypeName', tt?.name  || '');
                            update('price',          tt?.price || 0);
                        }}>
                        <option value="">-- Izaberi tip karte --</option>
                        {event.ticketTypes.map(t => (
                            <option key={t._id} value={t._id}>{t.name} — {t.price.toLocaleString()} RSD</option>
                        ))}
                    </Form.Select>
                ) : (
                    <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px' }}>
                        {!event
                            ? 'Tip karte se dodeljuje pri primeni šablona na događaj'
                            : 'Nema tipova karata — dodaj ih u editoru događaja'}
                    </div>
                )}
            </div>

            {/* Boja */}
            <div className="mb-2">
                {label('Boja sekcije')}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {PALETTE.map(c => (
                        <div key={c} onClick={() => update('color', c)}
                            style={{
                                width: 22, height: 22, borderRadius: 4, background: c,
                                cursor: 'pointer', boxSizing: 'border-box',
                                border: s.color === c ? '2.5px solid #1e293b' : '2px solid transparent',
                                transform: s.color === c ? 'scale(1.15)' : 'scale(1)',
                                transition: 'transform 0.1s',
                            }}
                        />
                    ))}
                    <input type="color" value={s.color} onChange={e => update('color', e.target.value)}
                        style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                </div>
            </div>

            <hr style={{ margin: '10px 0' }} />

            {/* Pozicija i dimenzije */}
            {label('Pozicija i veličina')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                    { f: 'x', l: 'X (px)', min: 0 }, { f: 'y', l: 'Y (px)', min: 0 },
                    { f: 'width', l: 'Širina', min: 60 }, { f: 'height', l: 'Visina', min: 40 },
                ].map(({ f, l, min }) => (
                    <div key={f}>
                        {label(l)}
                        <Form.Control size="sm" type="number" min={min}
                            value={s[f]} onChange={e => update(f, Math.max(min, +e.target.value))} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Decoration config panel ──────────────────────────────────────────────────
function DecorationConfigPanel({ decoration: d, update, onDelete }) {
    const label = text => <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 3 }}>{text}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {d.type === 'stage' ? '🎭 Bina' : d.type === 'entrance' ? '🚪 Ulaz' : '🔤 Tekst'}
                </p>
                <Button variant="outline-danger" size="sm" onClick={onDelete}><FaTrash /></Button>
            </div>

            <div className="mb-2">{label('Tekst')}
                <Form.Control size="sm" value={d.label} onChange={e => update('label', e.target.value)} />
            </div>

            {d.type !== 'entrance' && (
                <div className="mb-2">{label('Boja')}
                    <Form.Control type="color" size="sm" value={d.color} onChange={e => update('color', e.target.value)} />
                </div>
            )}

            <div className="mb-2">{label('Veličina fonta')}
                <Form.Control size="sm" type="number" min={8} max={60}
                    value={d.fontSize || 13} onChange={e => update('fontSize', +e.target.value)} />
            </div>

            <hr style={{ margin: '10px 0' }} />
            {label('Pozicija i veličina')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                    { f: 'x', l: 'X', min: 0 }, { f: 'y', l: 'Y', min: 0 },
                    { f: 'width', l: 'Širina', min: 30 }, { f: 'height', l: 'Visina', min: 20 },
                ].map(({ f, l, min }) => (
                    <div key={f}>{label(l)}
                        <Form.Control size="sm" type="number" min={min}
                            value={d[f]} onChange={e => update(f, Math.max(min, +e.target.value))} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Row label generator (same as backend) ────────────────────────────────────
function genRowLabels(rowCount, rowStart = 'A') {
    const labels = [];
    if (!isNaN(Number(rowStart))) {
        const n = Number(rowStart);
        for (let i = 0; i < rowCount; i++) labels.push(String(n + i));
    } else {
        const base = rowStart.charCodeAt(0) - 65;
        for (let i = 0; i < rowCount; i++) {
            const code = base + i;
            labels.push(code < 26
                ? String.fromCharCode(65 + code)
                : String.fromCharCode(65 + Math.floor(code / 26) - 1) + String.fromCharCode(65 + (code % 26)));
        }
    }
    return labels;
}

// ─── Section seat blocker ─────────────────────────────────────────────────────
function SectionSeatBlocker({ section: s, onUpdate }) {
    const [localSelected, setLocalSelected] = useState(new Set());

    const rowLabels    = genRowLabels(s.rowCount, s.rowStart);
    const blocked      = new Set(s.blockedSeats || []);
    const totalSeats   = s.rowCount * s.seatsPerRow;
    const blockedCount = blocked.size;

    const seatKey = (row, num) => `${row}-${num}`;

    const toggleSeat = (row, num) => {
        const key = seatKey(row, num);
        setLocalSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const blockSelected = () => {
        const newBlocked = new Set(blocked);
        localSelected.forEach(k => newBlocked.add(k));
        onUpdate('blockedSeats', Array.from(newBlocked));
        setLocalSelected(new Set());
    };

    const unblockSelected = () => {
        const newBlocked = new Set(blocked);
        localSelected.forEach(k => newBlocked.delete(k));
        onUpdate('blockedSeats', Array.from(newBlocked));
        setLocalSelected(new Set());
    };

    const clearAll = () => {
        onUpdate('blockedSeats', []);
        setLocalSelected(new Set());
    };

    const effectiveCapacity = totalSeats - blockedCount;

    return (
        <div>
            <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px' }}>
                    Blokiranje mesta — {s.name}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 4, padding: '2px 8px', color: '#166534' }}>
                        Ukupno: {totalSeats}
                    </span>
                    <span style={{ fontSize: 11, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 8px', color: '#991b1b' }}>
                        Blokirano: {blockedCount}
                    </span>
                    <span style={{ fontSize: 11, background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 4, padding: '2px 8px', color: '#1d4ed8' }}>
                        Aktivno: {effectiveCapacity}
                    </span>
                </div>

                {/* Legenda */}
                <div style={{ display: 'flex', gap: 10, fontSize: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    {[
                        { color: s.color, label: 'Slobodno' },
                        { color: '#22c55e', label: 'Selektovano' },
                        { color: '#ef4444', label: 'Blokirano' },
                    ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                            {l.label}
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                {localSelected.size > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <button onClick={blockSelected}
                            style={{ flex: 1, padding: '5px 8px', borderRadius: 5, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                            🚫 Blokiraj {localSelected.size}
                        </button>
                        <button onClick={unblockSelected}
                            style={{ flex: 1, padding: '5px 8px', borderRadius: 5, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                            ✓ Odblokiraj {localSelected.size}
                        </button>
                    </div>
                )}
                {blockedCount > 0 && !localSelected.size && (
                    <button onClick={clearAll}
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontWeight: 600, fontSize: 11, cursor: 'pointer', marginBottom: 8 }}>
                        Odblokiraj sva ({blockedCount})
                    </button>
                )}
            </div>

            {/* Seat grid */}
            <div style={{ overflowX: 'auto', background: '#f8fafc', borderRadius: 8, padding: '12px 8px', border: '1px solid #e2e8f0' }}>
                {rowLabels.map(row => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
                        <div style={{ width: 18, textAlign: 'right', fontSize: 9, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                            {row}
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                            {Array.from({ length: s.seatsPerRow }, (_, i) => {
                                const num = (s.seatStart || 1) + i;
                                const key = seatKey(row, num);
                                const isBlocked  = blocked.has(key);
                                const isSelected = localSelected.has(key);
                                return (
                                    <button key={key}
                                        onClick={() => toggleSeat(row, num)}
                                        title={`${row}${num}${isBlocked ? ' (blokirano)' : ''}`}
                                        style={{
                                            width: 14, height: 14, borderRadius: 2, padding: 0,
                                            background: isBlocked ? '#ef4444' : isSelected ? '#22c55e' : s.color + 'cc',
                                            border: isSelected ? '1px solid #16a34a' : '1px solid rgba(0,0,0,0.1)',
                                            cursor: 'pointer', flexShrink: 0,
                                            opacity: isBlocked && !isSelected ? 0.7 : 1,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
                Klikni mesta da ih selektuješ, pa pritisni "Blokiraj" ili "Odblokiraj". Blokirana mesta se neće generisati kao Seat dokumenti.
            </p>
        </div>
    );
}