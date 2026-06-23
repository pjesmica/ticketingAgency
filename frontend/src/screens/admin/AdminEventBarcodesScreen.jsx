import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaBarcode, FaFileCsv } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetEventBarcodesQuery } from '../../slices/eventsApiSlice';

const AdminEventBarcodesScreen = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, error } = useGetEventBarcodesQuery(eventId);

    const downloadCsv = () => {
        if (!data?.tickets?.length) return;

        const headers = ['Barkod', 'Kupac', 'Email', 'Tip karte', 'Sektor', 'Red', 'Mesto', 'Broj narudžbine'];

        const rows = data.tickets.map((t) => [
            t.barcode,
            t.kupac,
            t.email,
            t.ticketType,
            t.sektor,
            t.red,
            t.mesto,
            t.orderId,
        ]);

        const escapeCsv = (value) => {
            const str = String(value ?? '');
            return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };

        const csvContent =
            '\uFEFF' + // BOM za ispravan prikaz č/ć/š/ž/đ u Excel-u
            [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `barkodovi-${(data.event?.name || 'dogadjaj').replace(/[^a-zA-Z0-9čćšžđ]+/gi, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            <Button
                variant='outline-secondary'
                size='sm'
                className='mb-3'
                onClick={() => navigate('/admin/events')}
            >
                <FaArrowLeft className='me-2' />
                Nazad na događaje
            </Button>

            <Row className='align-items-center mb-4'>
                <Col>
                    <h1 className='fw-bold mb-0'>
                        <FaBarcode className='me-2 text-success' />
                        Barkodovi {data?.event?.name ? `— ${data.event.name}` : ''}
                    </h1>
                    <p className='text-muted mt-1 mb-0'>
                        {data?.count ?? 0} izdatih karata (samo plaćene narudžbine)
                    </p>
                </Col>
                <Col xs='auto'>
                    <Button
                        variant='success'
                        disabled={!data?.tickets?.length}
                        onClick={downloadCsv}
                    >
                        <FaFileCsv className='me-2' />
                        Preuzmi CSV
                    </Button>
                </Col>
            </Row>

            {isLoading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error?.data?.message || error.error}</Message>
            ) : data?.tickets?.length === 0 ? (
                <Message variant='info'>Još uvek nema plaćenih karata za ovaj događaj.</Message>
            ) : (
                <div className='table-responsive'>
                    <Table hover size='sm' className='align-middle'>
                        <thead className='table-light'>
                            <tr>
                                <th>Barkod</th>
                                <th>Kupac</th>
                                <th>Tip karte</th>
                                <th>Sedište</th>
                                <th>Narudžbina</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.tickets?.map((t, i) => (
                                <tr key={i}>
                                    <td>
                                        <code className='small'>{t.barcode}</code>
                                    </td>
                                    <td>
                                        <div className='small fw-semibold'>{t.kupac}</div>
                                        <div className='small text-muted'>{t.email}</div>
                                    </td>
                                    <td>
                                        <Badge bg='light' text='dark' className='border'>
                                            {t.ticketType}
                                        </Badge>
                                    </td>
                                    <td className='small font-monospace'>
                                        {t.sektor || t.red || t.mesto
                                            ? `${t.sektor ? t.sektor + ' ' : ''}${t.red || ''}${t.mesto || ''}`
                                            : '—'}
                                    </td>
                                    <td>
                                        <code className='small'>{t.orderId.slice(-8)}</code>
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

export default AdminEventBarcodesScreen;