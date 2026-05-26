import { useState } from 'react';
import { Row, Col, Container, Button, Form } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { FaBolt, FaSearch } from 'react-icons/fa';
import Event from '../components/Event';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { useGetEventsQuery } from '../slices/eventsApiSlice';

const CATEGORIES = ['Svi', 'Koncerti', 'Festivali', 'Sport', 'Pozorište', 'Komedija', 'Ostalo'];

const HomeScreen = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'Svi');

    const { data: events, isLoading, error } = useGetEventsQuery({
        keyword,
        category: activeCategory === 'Svi' ? '' : activeCategory,
    });

    const handleSearch = (e) => {
        e.preventDefault();

        const params = {};
        if (keyword) params.keyword = keyword;
        if (activeCategory !== 'Svi') params.category = activeCategory;

        setSearchParams(params);
    };

    const handleCategory = (cat) => {
        setActiveCategory(cat);

        const params = {};
        if (keyword) params.keyword = keyword;
        if (cat !== 'Svi') params.category = cat;

        setSearchParams(params);
    };

    return (
        <>
            {/* HERO */}
            <div className="bg-success bg-opacity-10 py-5">
                <Container className="text-center">

                    <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                        
                        <small className="text-uppercase fw-bold text-success">
                            Kupite karte odmah
                        </small>
                    </div>

                    <h1 className="fw-bold mb-3">
                        Pronađite savršen događaj
                    </h1>

                    <p className="text-muted mb-4">
                        Koncerti, festivali, predstave i mnogo više — sve na jednom mestu
                    </p>

                    {/* SEARCH */}
                    <Form
                        onSubmit={handleSearch}
                        className="d-flex gap-2 justify-content-center"
                    >
                        <div style={{ maxWidth: 400, width: '100%' }} className="position-relative">
                            <FaSearch
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: 12,
                                    transform: 'translateY(-50%)',
                                    color: '#6c757d'
                                }}
                            />

                            <Form.Control
                                type="text"
                                placeholder="Pretraži događaje..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                style={{ paddingLeft: '2.2rem' }}
                            />
                        </div>

                        <Button type="submit" variant="success">
                            Pretraži
                        </Button>
                    </Form>

                </Container>
            </div>

            {/* CONTENT */}
            <Container className="py-4">

                {/* CATEGORY FILTER */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map((cat) => (
                        <Button
                            key={cat}
                            variant={activeCategory === cat ? 'success' : 'outline-success'}
                            size="sm"
                            onClick={() => handleCategory(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* STATES */}
                {isLoading ? (
                    <Loader />
                ) : error ? (
                    <Message variant="danger">
                        {error?.data?.message || 'Greška pri učitavanju'}
                    </Message>
                ) : events && events.length === 0 ? (
                    <div className="text-center py-5">
                        <h4 className="text-muted">Nema događaja</h4>
                    </div>
                ) : (
                    <>
                        <h5 className="mb-3 fw-bold">
                            {activeCategory === 'Svi' ? 'Svi događaji' : activeCategory}
                            <span className="text-muted fw-normal ms-2">
                                ({events?.length || 0})
                            </span>
                        </h5>

                        <Row>
                            {events.map((event) => (
                                <Col key={event._id} sm={12} md={6} lg={4} className="mb-4">
                                    <Event event={event} />
                                </Col>
                            ))}
                        </Row>
                    </>
                )}

            </Container>
        </>
    );
};

export default HomeScreen;