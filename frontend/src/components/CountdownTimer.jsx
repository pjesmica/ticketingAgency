import { useEffect, useState } from 'react';

const getRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return null;

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
};

const pad = (n) => String(n).padStart(2, '0');

// Prikazuje tačno preostalo vreme do expiresAt, otkucava uživo svake sekunde.
// Kad istekne, poziva onExpire (npr. da se ponovo učita narudžbina).
const CountdownTimer = ({ expiresAt, className = '', onExpire }) => {
    const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));

    useEffect(() => {
        setRemaining(getRemaining(expiresAt));

        const interval = setInterval(() => {
            const next = getRemaining(expiresAt);
            setRemaining(next);
            if (!next && onExpire) {
                onExpire();
            }
        }, 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiresAt]);

    if (!remaining) {
        return <span className={className}>Vreme za plaćanje je isteklo</span>;
    }

    const { days, hours, minutes, seconds } = remaining;

    return (
        <span className={className}>
            {days > 0 && `${days}d `}
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
    );
};

export default CountdownTimer;