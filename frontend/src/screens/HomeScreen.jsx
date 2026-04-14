import React from 'react';
import { Row, Col } from 'react-bootstrap';
import event from '../eventList.js';
import Event from '../components/Event';

const HomeScreen = () => {
    return(
        <>
            <h1> Događaji</h1>
            <Row>
                {event.map((event) => (
                    <Col key={event._id} sm={12} ms={6} lg={4}>
                        <Event event={event} />
                    </Col>
                ))}
            </Row>
        </>
    )
}

export default HomeScreen;