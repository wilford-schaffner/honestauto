import { Router } from 'express';
import {
    listVehiclesPlain,
    showHome,
    showVehiclesBrowse,
    showVehicleDetail,
    showContactForm,
    handleContactSubmit
} from '../controllers/public.js';

const router = Router();

router.get('/', showHome);
router.get('/vehicles', showVehiclesBrowse);
router.get('/vehicles/:id', showVehicleDetail);
router.get('/contact', showContactForm);
router.post('/contact', handleContactSubmit);
router.get('/vehicles-debug', listVehiclesPlain);

export default router;

