import bcrypt from 'bcryptjs';

const users = [
    {
        name: 'Admin Korisnik',
        email: 'admin@ticketyx.com',
        password: bcrypt.hashSync('admin123', 10),
        isAdmin: true,
    },
    {
        name: 'Marko Marković',
        email: 'marko@example.com',
        password: bcrypt.hashSync('marko123', 10),
        isAdmin: false,
    },
    {
        name: 'Ana Anić',
        email: 'ana@example.com',
        password: bcrypt.hashSync('ana12345', 10),
        isAdmin: false,
    },
];

export default users;