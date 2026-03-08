import { Router } from 'express';
import { listVehiclesPlain } from '../controllers/public.js';

const router = Router();

router.get('/', listVehiclesPlain);

export default router;