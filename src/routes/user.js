import { Router } from 'express';
import {
    showUserDashboard,
    listServiceRequests,
    showNewServiceRequestForm,
    showServiceRequestDetail
} from '../controllers/user.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', showUserDashboard);
router.get('/service-requests', listServiceRequests);
router.get('/service-requests/new', showNewServiceRequestForm);
router.get('/service-requests/:id', showServiceRequestDetail);

export default router;

