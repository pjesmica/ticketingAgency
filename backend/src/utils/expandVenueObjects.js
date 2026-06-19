// Pretvara 'gazone' (GA / Fan Pit zona) objekte u pojedinačna 'seat' sedišta
// radi sinhronizacije sa Seat kolekcijom. Svaka zona dobija svoj red oblika
// "GA-<sektor>" sa sekvencijalnim brojevima mesta 1..capacity, kako bi se
// uklopila u postojeći model karata (red + broj mesta = jedinstven identifikator).

const sanitizeRowName = (sector) =>
    `GA-${(sector || 'GA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'GA'}`;

const expandVenueObjects = (objects = []) => {
    const expanded = [];

    for (const obj of objects) {
        if (obj.type !== 'gazone') {
            expanded.push(obj);
            continue;
        }

        const capacity = Math.max(0, Number(obj.capacity) || 0);
        const row = sanitizeRowName(obj.sector);

        for (let i = 1; i <= capacity; i++) {
            expanded.push({
                id: `${obj.id}-${i}`,
                type: 'seat',
                x: obj.x,
                y: obj.y,
                row,
                seatNumber: i,
                sector: obj.sector || 'GA',
                ticketTypeId: obj.ticketTypeId || '',
                ticketTypeName: obj.ticketTypeName || 'Regular',
                price: obj.price || 0,
            });
        }
    }

    return expanded;
};

export default expandVenueObjects;