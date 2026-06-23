import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaShoppingCart, FaChair, FaRunning } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetEventDetailsQuery } from '../slices/eventsApiSlice';
import { useGetVenueSectionsQuery } from '../slices/venueSectionApiSlice';
import { useGetSeatsForEventQuery } from '../slices/seatsApiSlice';
import { addToCart } from '../slices/cartSlice';

const sectionCapacity = s =>
    s.sectorType === 'standing' ? (s.capacity || 0) : (s.rowCount || 0) * (s.seatsPerRow || 0);

export default function SeatMapScreen() {
    const { id: eventId } = useParams();
    const navigate        = useNavigate();
    const dispatch        = useDispatch();
    const { userInfo }    = useSelector(s => s.auth);

    const { data: event,  isLoading: loadingEvent  } = useGetEventDetailsQuery(eventId);
    const { data: layout, isLoading: loadingLayout } = useGetVenueSectionsQuery(eventId);
    const { data: seats,  isLoading: loadingSeats  } = useGetSeatsForEventQuery(eventId);

    const [focusedSectionId, setFocusedSectionId] = useState(null);
    const [selectedSeatIds,  setSelectedSeatIds]  = useState(new Set());
    const [gaQuantities,     setGaQuantities]     = useState({});

    const seatsBySection = useMemo(() => {
        if (!seats) return {};
        return seats.reduce((acc, seat) => {
            const key = seat.section?.toString() || 'nosection';
            if (!acc[key]) acc[key] = [];
            acc[key].push(seat);
            return acc;
        }, {});
    }, [seats]);

    const sections    = layout?.sections    || [];
    const decorations = layout?.decorations || [];
    const focusedSection = sections.find(s => (s._id || s._localId) === focusedSectionId);

    const toggleSeat = seat => {
        if (seat.isReserved) return;
        setSelectedSeatIds(prev => {
            const next = new Set(prev);
            if (next.has(seat._id)) next.delete(seat._id);
            else next.add(seat._id);
            return next;
        });
    };

    const setGaQty = (section, qty) => {
        const id   = section._id || section._localId;
        const pool = (seatsBySection[id] || []).filter(s => !s.isReserved);
        const safeQty = Math.max(0, Math.min(qty, pool.length));
        const tt = event?.ticketTypes?.find(t => t._id?.toString() === section.ticketTypeId);
        if (tt && safeQty > tt.availableQuantity) {
            toast.warning(`Dostupno je samo ${tt.availableQuantity} kart(a) za "${tt.name}"`);
            return;
        }
        setGaQuantities(prev => ({ ...prev, [id]: safeQty }));
    };

    const selectedSeats = useMemo(() =>
        seats ? seats.filter(s => selectedSeatIds.has(s._id)) : [],
    [seats, selectedSeatIds]);

    const cartItems = useMemo(() => {
        const items = [];
        sections.filter(s => s.sectorType === 'standing').forEach(sec => {
            const id  = sec._id || sec._localId;
            const qty = gaQuantities[id] || 0;
            if (qty > 0) {
                const pool = (seatsBySection[id] || []).filter(s => !s.isReserved);
                items.push({
                    sectionName: sec.name, sectorType: 'standing',
                    qty, price: sec.price,
                    ticketTypeName: sec.ticketTypeName, ticketTypeId: sec.ticketTypeId,
                    seats: pool.slice(0, qty),
                });
            }
        });
        if (selectedSeats.length > 0) {
            const grouped = selectedSeats.reduce((acc, seat) => {
                const key = seat.ticketType?.toString() || 'default';
                if (!acc[key]) acc[key] = { seats: [], ticketTypeName: seat.ticketTypeName, ticketTypeId: seat.ticketType, price: seat.price };
                acc[key].seats.push(seat);
                return acc;
            }, {});
            Object.values(grouped).forEach(g => {
                items.push({
                    sectorType: 'seated', qty: g.seats.length,
                    price: g.price, ticketTypeName: g.ticketTypeName,
                    ticketTypeId: g.ticketTypeId?.toString(), seats: g.seats,
                });
            });
        }
        return items;
    }, [selectedSeats, gaQuantities, sections, seatsBySection]);

    const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);
    const totalPrice = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

    const handleAddToCart = () => {
        if (!userInfo) { navigate('/login'); return; }
        if (!totalItems) { toast.warning('Izaberite sedišta ili karte'); return; }
        cartItems.forEach(item => {
            dispatch(addToCart({
                eventId, eventName: event.name,
                eventDate: event.startDate, eventVenue: event.venue?.name,
                ticketType: item.ticketTypeName, ticketTypeId: item.ticketTypeId,
                price: item.price, quantity: item.qty,
                seats: item.seats.map(s => ({
                    seatId: s._id, row: s.row, seatNumber: s.seatNumber, sector: s.sector,
                })),
            }));
        });
        toast.success(`${totalItems} kart(e) dodato u korpu`);
        navigate('/cart');
    };

    if (loadingEvent || loadingLayout || loadingSeats)
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spinner animation="border" variant="success" />
            </div>
        );

    if (!sections.length)
        return (
            <div className="py-5">
                <Alert variant="info">Mapa sale još nije konfigurisana za ovaj događaj.</Alert>
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2" />Nazad
                </Button>
            </div>
        );

    return (
        <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
            {/* Header */}
            <div style={{ background: '#1e293b', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button variant="outline-light" size="sm"
                    onClick={() => focusedSectionId ? setFocusedSectionId(null) : navigate(-1)}>
                    <FaArrowLeft />
                </Button>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{event?.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {focusedSectionId
                            ? `← Nazad na mapu · ${focusedSection?.name}`
                            : `${event?.venue?.name || ''} · ${new Date(event?.startDate).toLocaleDateString('sr-RS')}`}
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                {totalItems > 0 && (
                    <div style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>
                        {totalItems} izabrano · {totalPrice.toLocaleString()} RSD
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                {/* Map */}
                <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                    {!focusedSectionId ? (
                        <VenueOverviewMap
                            sections={sections}
                            decorations={decorations}
                            seatsBySection={seatsBySection}
                            selectedSeatIds={selectedSeatIds}
                            gaQuantities={gaQuantities}
                            onSectionClick={sec => {
                                if (sec.sectorType !== 'standing')
                                    setFocusedSectionId(sec._id || sec._localId);
                            }}
                            onGaChange={setGaQty}
                        />
                    ) : (
                        <SectionSeatPicker
                            section={focusedSection}
                            seats={seatsBySection[focusedSectionId] || []}
                            selectedSeatIds={selectedSeatIds}
                            onToggle={toggleSeat}
                            stage={decorations.find(d => d.type === 'stage')}
                        />
                    )}
                </div>

                {/* Cart sidebar */}
                <div style={{
                    width: 300, background: '#fff', borderLeft: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column', flexShrink: 0,
                }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                        <FaShoppingCart style={{ marginRight: 8, color: '#3b82f6' }} />
                        Izabrane karte
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                        {cartItems.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>
                                <FaChair style={{ fontSize: 32, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                                <p>Klikni na sekciju da izabereš sedišta</p>
                            </div>
                        ) : cartItems.map((item, i) => (
                            <div key={i} style={{
                                padding: '8px 10px', marginBottom: 6,
                                background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span style={{ fontWeight: 600, fontSize: 12 }}>
                                        {item.sectorType === 'standing'
                                            ? <><FaRunning style={{ marginRight: 3 }} />{item.sectionName}</>
                                            : item.ticketTypeName}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: 12, color: '#0f766e' }}>
                                        {(item.qty * item.price).toLocaleString()} RSD
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                    {item.qty}× {item.price.toLocaleString()} RSD
                                    {item.sectorType === 'seated' && item.seats.length <= 6 && (
                                        <> · {item.seats.map(s => `${s.row}${s.seatNumber}`).join(', ')}</>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '12px 16px', borderTop: '2px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontWeight: 600 }}>Ukupno</span>
                            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f766e' }}>
                                {totalPrice.toLocaleString()} RSD
                            </span>
                        </div>
                        <Button variant="success" className="w-100" disabled={!totalItems} onClick={handleAddToCart}>
                            <FaShoppingCart className="me-2" />
                            Dodaj u korpu ({totalItems})
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Overview SVG map ─────────────────────────────────────────────────────────
function VenueOverviewMap({ sections, decorations, seatsBySection, selectedSeatIds, gaQuantities, onSectionClick, onGaChange }) {
    const [hovered, setHovered] = useState(null);

    const allObjs = [...sections, ...decorations];
    if (!allObjs.length) return null;

    const minX = Math.min(...allObjs.map(o => o.x)) - 20;
    const minY = Math.min(...allObjs.map(o => o.y)) - 20;
    const maxX = Math.max(...allObjs.map(o => o.x + (o.width || 100))) + 20;
    const maxY = Math.max(...allObjs.map(o => o.y + (o.height || 60))) + 20;

    return (
        <div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                Klikni na sekciju da izabereš konkretna mesta. GA zone — koristi +/− direktno ispod.
            </p>

            <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                style={{ width: '100%', maxWidth: 900, display: 'block', margin: '0 auto' }}>

                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.8" fill="#cbd5e1" />
                    </pattern>
                </defs>
                <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="url(#grid)" />

                {/* Decorations */}
                {decorations.map((d, i) => (
                    <g key={i}>
                        <rect x={d.x} y={d.y} width={d.width} height={d.height}
                            fill={d.type === 'stage' ? d.color : d.type === 'entrance' ? '#d1fae5' : 'transparent'}
                            stroke={d.type === 'label' ? '#94a3b8' : d.color}
                            strokeWidth={1.5} strokeDasharray={d.type === 'label' ? '4 2' : 'none'} rx={6} />
                        <text x={d.x + d.width / 2} y={d.y + d.height / 2 + 5}
                            textAnchor="middle"
                            fill={d.type === 'stage' ? '#fff' : d.color}
                            fontSize={Math.min(d.fontSize || 13, d.height * 0.55)}
                            fontWeight="700" letterSpacing={d.type === 'stage' ? 3 : 0}>
                            {d.label}
                        </text>
                    </g>
                ))}

                {/* Sections */}
                {sections.map(sec => {
                    const id = sec._id || sec._localId;
                    const secSeats = seatsBySection[id] || [];
                    const selectedInSec = sec.sectorType === 'seated'
                        ? secSeats.filter(s => selectedSeatIds.has(s._id)).length
                        : (gaQuantities[id] || 0);
                    const isHovered = hovered === id;

                    return (
                        <g key={id} style={{ cursor: sec.sectorType === 'standing' ? 'default' : 'pointer' }}
                            transform={sec.angle ? `rotate(${sec.angle}, ${sec.x + sec.width / 2}, ${sec.y + sec.height / 2})` : undefined}
                            onClick={() => onSectionClick(sec)}
                            onMouseEnter={() => setHovered(id)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <rect x={sec.x} y={sec.y} width={sec.width} height={sec.height}
                                fill={sec.color + '22'}
                                stroke={selectedInSec > 0 ? '#22c55e' : isHovered ? sec.color : sec.color + '88'}
                                strokeWidth={selectedInSec > 0 ? 3 : isHovered ? 2.5 : 2}
                                strokeDasharray={sec.sectorType === 'standing' ? '6 3' : 'none'}
                                rx={8} />

                            {/* Name header */}
                            <rect x={sec.x} y={sec.y} width={sec.width} height={26}
                                fill={sec.color + 'dd'} rx={8} />
                            <rect x={sec.x} y={sec.y + 18} width={sec.width} height={8} fill={sec.color + 'dd'} />
                            <text x={sec.x + sec.width / 2} y={sec.y + 17}
                                textAnchor="middle" fill="#fff"
                                fontSize={Math.min(13, sec.width / 10)} fontWeight="700">
                                {sec.name}
                            </text>

                            {/* Center info */}
                            <text x={sec.x + sec.width / 2} y={sec.y + sec.height / 2 + 4}
                                textAnchor="middle" fill={sec.color}
                                fontSize={Math.min(12, sec.width / 14)} fontWeight="700">
                                {sec.sectorType === 'standing' ? 'Stajanje' : `${sec.rowCount}r × ${sec.seatsPerRow}m`}
                            </text>
                            <text x={sec.x + sec.width / 2} y={sec.y + sec.height / 2 + 18}
                                textAnchor="middle" fill="#475569" fontSize={Math.min(11, sec.width / 16)}>
                                {sec.price.toLocaleString()} RSD · {sec.ticketTypeName}
                            </text>

                            {selectedInSec > 0 && (
                                <text x={sec.x + sec.width / 2} y={sec.y + sec.height - 10}
                                    textAnchor="middle" fill="#16a34a" fontSize={11} fontWeight="700">
                                    ✓ {selectedInSec} izabrano
                                </text>
                            )}
                            {isHovered && sec.sectorType === 'seated' && !selectedInSec && (
                                <text x={sec.x + sec.width / 2} y={sec.y + sec.height - 10}
                                    textAnchor="middle" fill={sec.color} fontSize={10} fontWeight="600">
                                    Klikni za izbor sedišta →
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* GA cards */}
            {sections.filter(s => s.sectorType === 'standing').length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 8 }}>Zone za stajanje</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {sections.filter(s => s.sectorType === 'standing').map(sec => {
                            const id   = sec._id || sec._localId;
                            const pool = (seatsBySection[id] || []).filter(s => !s.isReserved);
                            const qty  = gaQuantities[id] || 0;
                            return (
                                <GACard key={id} section={sec} available={pool.length}
                                    qty={qty} onChange={q => onGaChange(sec, q)} />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── GA card ──────────────────────────────────────────────────────────────────
function GACard({ section: s, available, qty, onChange }) {
    return (
        <div style={{
            border: `2px solid ${s.color}`, borderRadius: 10,
            padding: '14px 16px', background: s.color + '10', minWidth: 200,
        }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: s.color, marginBottom: 2 }}>
                <FaRunning style={{ marginRight: 5 }} />{s.name}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                {s.price.toLocaleString()} RSD · {s.ticketTypeName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => onChange(qty - 1)} disabled={qty === 0}
                    style={{
                        width: 32, height: 32, borderRadius: 6,
                        border: '1.5px solid #e2e8f0', background: '#fff',
                        cursor: qty === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 16,
                    }}>−</button>
                <span style={{ fontWeight: 700, fontSize: 18, minWidth: 28, textAlign: 'center', color: qty > 0 ? '#0f766e' : '#374151' }}>
                    {qty}
                </span>
                <button onClick={() => onChange(qty + 1)} disabled={available === 0}
                    style={{
                        width: 32, height: 32, borderRadius: 6,
                        border: '1.5px solid #e2e8f0', background: '#fff',
                        cursor: available === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 16,
                    }}>+</button>
            </div>
        </div>
    );
}

// ─── Helper: na kojoj se strani nalazi bina u odnosu na sekciju ─────────────
// Vraća 'top' | 'bottom' | 'left' | 'right' — koristi se da prikaz unutar
// sekcije (SectionSeatPicker) bude orijentisan isto kao na glavnoj mapi sale,
// da korisnika ne zbuni kad uđe u sekciju da bira sedišta.
const getStageSide = (section, stage) => {
    if (!section || !stage) return 'top';

    const sectionCenterX = section.x + section.width / 2;
    const sectionCenterY = section.y + section.height / 2;
    const stageCenterX   = stage.x + (stage.width || 0) / 2;
    const stageCenterY   = stage.y + (stage.height || 0) / 2;

    const dx = stageCenterX - sectionCenterX;
    const dy = stageCenterY - sectionCenterY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'bottom' : 'top';
};

// ─── Section seat picker ──────────────────────────────────────────────────────
function SectionSeatPicker({ section, seats, selectedSeatIds, onToggle, stage }) {
    if (!section) return null;

    const stageSide    = getStageSide(section, stage);
    const isHorizontal = stageSide === 'left' || stageSide === 'right';
    const stageLabel   = (stage?.label?.trim()) || 'BINA';

    const byRow = seats.reduce((acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
    }, {});

    let rows = Object.keys(byRow).sort();

    // Red sa najmanjom oznakom (npr. "A") je po konvenciji najbliži bini —
    // poređaj redove tako da taj red uvek bude vizuelno najbliži BINA oznaci.
    if (stageSide === 'bottom' || stageSide === 'right') {
        rows = [...rows].reverse();
    }

    const filtered = rows.map(row => ({ row, seats: byRow[row] }));

    const selectedInSection = seats.filter(s => selectedSeatIds.has(s._id)).length;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: section.color }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>{section.name}</span>
                {selectedInSection > 0 && (
                    <Badge bg="success">{selectedInSection} izabrano</Badge>
                )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {[
                    { color: section.color, label: 'Slobodno' },
                    { color: '#22c55e',     label: 'Izabrano' },
                    { color: '#e2e8f0',     label: 'Zauzeto'  },
                    { color: '#1e293b',     label: 'Blokirano', opacity: 0.5 },
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: l.color, opacity: l.opacity || 1 }} />
                        {l.label}
                    </div>
                ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'auto' }}>
                {!isHorizontal ? (
                    /* Bina je gore ili dole — redovi naslagani vertikalno (kao i do sada) */
                    <>
                        {stageSide === 'top' && (
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ display: 'inline-block', padding: '14px 48px', background: '#1e293b', color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                    ▼ {stageLabel}
                                </div>
                            </div>
                        )}

                        {filtered.map(({ row, seats: rowSeats }) => (
                            <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                <div style={{ width: 28, textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                                    {row}
                                </div>
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {rowSeats.sort((a, b) => a.seatNumber - b.seatNumber).map(seat => (
                                        <SeatButton key={seat._id} seat={seat} row={row} section={section}
                                            isSelected={selectedSeatIds.has(seat._id)} onToggle={onToggle} />
                                    ))}
                                </div>
                                <div style={{ width: 28, fontSize: 10, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                                    {row}
                                </div>
                            </div>
                        ))}

                        {stageSide === 'bottom' && (
                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <div style={{ display: 'inline-block', padding: '14px 48px', background: '#1e293b', color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                    ▲ {stageLabel}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Bina je levo ili desno — redovi naslagani kao kolone (transponovano) */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {stageSide === 'left' && (
                            <div style={{ writingMode: 'vertical-rl', flexShrink: 0 }}>
                                <div style={{ display: 'inline-block', padding: '48px 14px', background: '#1e293b', color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                    {stageLabel}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                            {filtered.map(({ row, seats: rowSeats }) => (
                                <div key={row} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{row}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        {rowSeats.sort((a, b) => a.seatNumber - b.seatNumber).map(seat => (
                                            <SeatButton key={seat._id} seat={seat} row={row} section={section}
                                                isSelected={selectedSeatIds.has(seat._id)} onToggle={onToggle} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{row}</div>
                                </div>
                            ))}
                        </div>

                        {stageSide === 'right' && (
                            <div style={{ writingMode: 'vertical-rl', flexShrink: 0 }}>
                                <div style={{ display: 'inline-block', padding: '48px 14px', background: '#1e293b', color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                    {stageLabel}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {filtered.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: 13 }}>
                        Nema sedišta u ovoj sekciji
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Pojedinačno dugme sedišta (deljeno između vertikalnog i transponovanog prikaza) ──
function SeatButton({ seat, row, section, isSelected, onToggle }) {
    const isRes     = seat.isReserved && !seat.isBlocked;
    const isBlocked = seat.isBlocked;
    return (
        <button
            onClick={() => !isBlocked && onToggle(seat)}
            disabled={isRes || isBlocked}
            title={isBlocked ? `Blokirano mesto` : `${row}${seat.seatNumber} · ${seat.price} RSD`}
            style={{
                width: 20, height: 20, borderRadius: 3, padding: 0,
                background: isBlocked ? '#1e293b' : isRes ? '#e2e8f0' : isSelected ? '#22c55e' : section.color,
                border: isSelected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)',
                boxShadow: isSelected ? `0 0 0 2px #22c55e` : 'none',
                cursor: isBlocked ? 'not-allowed' : isRes ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, color: isBlocked ? '#475569' : isRes ? '#9ca3af' : '#fff',
                fontWeight: 700, flexShrink: 0,
                opacity: isBlocked ? 0.5 : isRes ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!isRes && !isBlocked) e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
            {!isBlocked && seat.seatNumber}
        </button>
    );
}