import { Router } from 'express';
import { showHome } from '../controllers/public.js';

const router = Router();

router.get('/', showHome);

export default router;