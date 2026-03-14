import { Router } from 'express';
import {
    showEmployeeDashboard,
    showEmployeeVehicles,
    showEmployeeReviews,
    showEmployeeServiceRequests,
    showEmployeeServiceRequestDetail,
    showEmployeeContactSubmissions
} from '../controllers/employee.js';

const router = Router();

router.get('/', showEmployeeDashboard);
router.get('/vehicles', showEmployeeVehicles);
router.get('/reviews', showEmployeeReviews);
router.get('/service-requests', showEmployeeServiceRequests);
router.get('/service-requests/:id', showEmployeeServiceRequestDetail);
router.get('/contact-submissions', showEmployeeContactSubmissions);

export default router;

