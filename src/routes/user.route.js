import express from 'express';
import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
} from '../controllers/user.controller.js';
const router = express.Router();

// Manage users
router.post('/', createUser);
router.get('/', getUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
