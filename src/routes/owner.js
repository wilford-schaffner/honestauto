import { Router } from 'express';
import {
    showOwnerDashboard,
    showOwnerVehicles,
    showNewOwnerVehicle,
    createOwnerVehicle,
    showOwnerVehicleEdit,
    updateOwnerVehicle,
    deleteOwnerVehicle,
    showOwnerCategories,
    createOwnerCategory,
    showOwnerCategoryEdit,
    updateOwnerCategory,
    deleteOwnerCategory,
    showOwnerUsers,
    updateOwnerUserRole,
    showOwnerContactSubmissions
} from '../controllers/owner.js';
import { makePostToggleContactMessageResolved } from '../controllers/contactMessageActions.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../models/user.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.OWNER));

router.get('/', showOwnerDashboard);
router.get('/vehicles', showOwnerVehicles);
router.get('/vehicles/new', showNewOwnerVehicle);
router.post('/vehicles/new', createOwnerVehicle);
router.get('/vehicles/:id/edit', showOwnerVehicleEdit);
router.post('/vehicles/:id', updateOwnerVehicle);
router.post('/vehicles/:id/delete', deleteOwnerVehicle);
router.get('/categories', showOwnerCategories);
router.post('/categories', createOwnerCategory);
router.get('/categories/:id/edit', showOwnerCategoryEdit);
router.post('/categories/:id', updateOwnerCategory);
router.post('/categories/:id/delete', deleteOwnerCategory);
router.get('/users', showOwnerUsers);
router.post('/users/:id/role', updateOwnerUserRole);
router.get('/contact-submissions', showOwnerContactSubmissions);
router.post(
    '/contact-messages/:id/toggle-resolved',
    makePostToggleContactMessageResolved('/dashboard/owner')
);

export default router;

