import { FaShoppingCart, FaTicketAlt, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { Container } from 'react-bootstrap';

const steps = [
    { label: 'Korpa', icon: <FaShoppingCart /> },
    { label: 'Pregled', icon: <FaTicketAlt /> },
    { label: 'Plaćanje', icon: <FaCreditCard /> },
    { label: 'Potvrda', icon: <FaCheckCircle /> },
];

const CheckoutSteps = ({ currentStep }) => {
    return (
        <Container className="my-4">
            <div className="d-flex justify-content-between align-items-center">

                {steps.map((step, idx) => {
                    const num = idx + 1;
                    const isActive = num === currentStep;
                    const isDone = num < currentStep;

                    return (
                        <div
                            key={step.label}
                            className="d-flex align-items-center flex-grow-1"
                        >
                            {/* STEP */}
                            <div className="text-center flex-grow-1">

                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        backgroundColor: isDone
                                            ? '#10b981'
                                            : isActive
                                            ? '#0d6efd'
                                            : '#e9ecef',
                                        color: isDone || isActive ? '#fff' : '#6c757d'
                                    }}
                                >
                                    {isDone ? '✓' : num}
                                </div>

                                <small
                                    className={isActive ? 'fw-bold text-primary' : 'text-muted'}
                                >
                                    {step.label}
                                </small>
                            </div>

                            {/* LINE */}
                            {idx < steps.length - 1 && (
                                <div
                                    style={{
                                        height: 2,
                                        flex: 1,
                                        backgroundColor: num < currentStep ? '#10b981' : '#dee2e6',
                                        marginBottom: 18
                                    }}
                                />
                            )}
                        </div>
                    );
                })}

            </div>
        </Container>
    );
};

export default CheckoutSteps;