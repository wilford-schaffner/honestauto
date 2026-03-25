import { Router } from 'express';
import {
    listVehiclesPlain,
    showHome,
    showVehiclesBrowse,
    showVehicleDetail,
    showContactForm,
    handleContactSubmit
} from '../controllers/public.js';
import {
    showNewReview,
    createReview,
    showEditReview,
    updateReview,
    deleteReview
} from '../controllers/review.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', showHome);
router.get('/vehicles', showVehiclesBrowse);
router.get('/vehicles/:vehicleId/reviews/new', requireAuth, showNewReview);
router.post('/vehicles/:vehicleId/reviews', requireAuth, createReview);
router.get('/vehicles/:vehicleId/reviews/:reviewId/edit', requireAuth, showEditReview);
router.post('/vehicles/:vehicleId/reviews/:reviewId/update', requireAuth, updateReview);
router.post('/vehicles/:vehicleId/reviews/:reviewId/delete', requireAuth, deleteReview);
router.get('/vehicles/:id', showVehicleDetail);
router.get('/contact', showContactForm);
router.post('/contact', handleContactSubmit);
router.get('/vehicles-debug', listVehiclesPlain);

export default router;

