import { Router } from 'express';
import {
    listServiceRequests,
    showNewServiceRequestForm,
    showServiceRequestDetail,
    createServiceRequestHandler,
    cancelServiceRequestHandler
} from '../controllers/user.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', listServiceRequests);
router.get('/service-requests', listServiceRequests);
router.get('/service-requests/new', showNewServiceRequestForm);
router.post('/service-requests', createServiceRequestHandler);
router.get('/service-requests/:id', showServiceRequestDetail);
router.post('/service-requests/:id/cancel', cancelServiceRequestHandler);

export default router;

