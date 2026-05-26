import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Placeholder – za produkciju koristiti multer + cloud storage (npr. Cloudinary)
router.post('/', protect, admin, (req, res) => {
    res.status(200).json({ message: 'Upload nije konfigurisan. Koristite URL slike.' });
});

export default router;