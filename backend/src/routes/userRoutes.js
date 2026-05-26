import express from 'express';
import {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    getUserById,
    deleteUser,
    updateUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * PUBLIC
 */
router.post('/', registerUser);        // register (NEMA auth)
router.post('/login', authUser);
router.post('/logout', logoutUser);

/**
 * USER PROFILE
 */
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

/**
 * ADMIN ONLY
 */
router.get('/', protect, admin, getUsers);

router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;