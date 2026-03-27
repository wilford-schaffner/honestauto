import { Router } from 'express';
import {
    showEmployeeDashboard,
    showEmployeeVehicles,
    showEmployeeVehicleEdit,
    updateEmployeeVehicle,
    showEmployeeReviews,
    removeEmployeeReview,
    showEmployeeServiceRequests,
    showEmployeeServiceRequestDetail,
    updateEmployeeServiceRequest,
    showEmployeeContactSubmissions
} from '../controllers/employee.js';
import {
    makePostToggleContactMessageResolved,
    makePostResolveAllContactMessages
} from '../controllers/contactMessageActions.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../models/user.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.EMPLOYEE, ROLES.OWNER));

router.get('/', showEmployeeDashboard);
router.get('/vehicles', showEmployeeVehicles);
router.get('/vehicles/:id/edit', showEmployeeVehicleEdit);
router.post('/vehicles/:id', updateEmployeeVehicle);
router.get('/reviews', showEmployeeReviews);
router.post('/reviews/:id/delete', removeEmployeeReview);
router.get('/service-requests', showEmployeeServiceRequests);
router.get('/service-requests/:id', showEmployeeServiceRequestDetail);
router.post('/service-requests/:id', updateEmployeeServiceRequest);
router.get('/contact-submissions', showEmployeeContactSubmissions);
router.post(
    '/contact-messages/resolve-all',
    makePostResolveAllContactMessages('/dashboard/employee')
);
router.post(
    '/contact-messages/:id/toggle-resolved',
    makePostToggleContactMessageResolved('/dashboard/employee')
);

export default router;

