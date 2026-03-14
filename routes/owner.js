import { Router } from 'express';
import {
    showOwnerDashboard,
    showOwnerVehicles,
    showOwnerCategories,
    showOwnerUsers,
    showOwnerContactSubmissions
} from '../controllers/owner.js';

const router = Router();

router.get('/', showOwnerDashboard);
router.get('/vehicles', showOwnerVehicles);
router.get('/categories', showOwnerCategories);
router.get('/users', showOwnerUsers);
router.get('/contact-submissions', showOwnerContactSubmissions);

export default router;

