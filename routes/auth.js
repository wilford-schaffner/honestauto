import { Router } from 'express';
import {
    showLoginForm,
    handleLogin,
    showRegisterForm,
    handleRegister,
    handleLogout
} from '../controllers/auth.js';

const router = Router();

router.get('/login', showLoginForm);
router.post('/login', handleLogin);

router.get('/register', showRegisterForm);
router.post('/register', handleRegister);

router.post('/logout', handleLogout);

export default router;

