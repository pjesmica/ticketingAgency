import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Uploads folder: backend/uploads/  (van src/ da ne restartuje nodemon)
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        // Jedinstveno ime: timestamp + originalna ekstenzija
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
    if (ok) cb(null, true);
    else cb(new Error('Dozvoljeni su samo fajlovi slika (jpg, png, gif, webp)'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
});

// POST /api/upload  →  { url: '/uploads/filename.jpg' }
router.post('/', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Fajl nije priložen' });
    }
    // Vraća putanju relativnu na root servera — frontend je koristi direktno
    res.status(200).json({ url: `/uploads/${req.file.filename}` });
});

export default router;