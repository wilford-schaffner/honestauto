import { Router } from 'express';
import {
    showOwnerDashboard,
    showOwnerVehicles,
    showOwnerCategories,
    showOwnerUsers,
    showOwnerContactSubmissions
} from '../controllers/owner.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../models/user.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.OWNER));

router.get('/', showOwnerDashboard);
router.get('/vehicles', showOwnerVehicles);
router.get('/categories', showOwnerCategories);
router.get('/users', showOwnerUsers);
router.get('/contact-submissions', showOwnerContactSubmissions);

export default router;

