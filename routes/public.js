import { Router } from 'express';
import { listVehiclesPlain, showHome } from '../controllers/public.js';

const router = Router();

router.get('/', showHome);
router.get('/vehicles-debug', listVehiclesPlain);

export default router;

