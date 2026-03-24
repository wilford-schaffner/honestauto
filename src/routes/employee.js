import { Router } from 'express';
import {
    showEmployeeDashboard,
    showEmployeeVehicles,
    showEmployeeReviews,
    showEmployeeServiceRequests,
    showEmployeeServiceRequestDetail,
    showEmployeeContactSubmissions
} from '../controllers/employee.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../models/user.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.EMPLOYEE, ROLES.OWNER));

router.get('/', showEmployeeDashboard);
router.get('/vehicles', showEmployeeVehicles);
router.get('/reviews', showEmployeeReviews);
router.get('/service-requests', showEmployeeServiceRequests);
router.get('/service-requests/:id', showEmployeeServiceRequestDetail);
router.get('/contact-submissions', showEmployeeContactSubmissions);

export default router;

