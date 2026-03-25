import { getVehicleById } from '../models/vehicle.js';
import {
    listReviewsForVehicle,
    findReviewByUserAndVehicle,
    getReviewById,
    createReview as insertReview,
    updateReview as patchReview,
    deleteReviewForUser,
    deleteReviewById
} from '../models/review.js';
import { parseReviewPayload } from '../middleware/validation.js';
import { ROLES } from '../models/user.js';

const parsePositiveInt = (raw) => {
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
};

const staffRoles = new Set([ROLES.EMPLOYEE, ROLES.OWNER]);

const renderNewReviewPage = async (req, res, next, options) => {
    try {
        const vehicleId = options.vehicleId;
        const vehicle = await getVehicleById(vehicleId);
        if (!vehicle) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const userId = req.session.user.id;
        const existing = await findReviewByUserAndVehicle(userId, vehicleId);
        if (existing) {
            req.session.flash = {
                info: 'You already reviewed this vehicle. You can edit your review below.'
            };
            return res.redirect(`/vehicles/${vehicleId}/reviews/${existing.id}/edit`);
        }

        res.render('reviews/new', {
            title: `Write review – ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle,
            form: options.form ?? { rating: '', body: '' },
            fieldErrors: options.fieldErrors ?? {},
            error: options.error ?? null
        });
    } catch (error) {
        next(error);
    }
};

const showNewReview = async (req, res, next) => {
    const vehicleId = parsePositiveInt(req.params.vehicleId);
    if (!vehicleId) {
        const err = new Error('Page not found');
        err.status = 404;
        throw err;
    }
    await renderNewReviewPage(req, res, next, { vehicleId });
};

const createReview = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.vehicleId);
        if (!vehicleId) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const { data, fieldErrors } = parseReviewPayload(req.body);
        if (!data) {
            const rawRating = req.body?.rating;
            const ratingVal =
                rawRating === undefined || rawRating === null ? '' : String(rawRating);
            const bodyVal = typeof req.body?.body === 'string' ? req.body.body : '';
            await renderNewReviewPage(req, res, next, {
                vehicleId,
                form: { rating: ratingVal, body: bodyVal },
                fieldErrors,
                error: 'Please fix the highlighted fields.'
            });
            return;
        }

        const vehicle = await getVehicleById(vehicleId);
        if (!vehicle) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const userId = req.session.user.id;
        const existing = await findReviewByUserAndVehicle(userId, vehicleId);
        if (existing) {
            req.session.flash = {
                info: 'You already reviewed this vehicle. You can edit your review below.'
            };
            return res.redirect(`/vehicles/${vehicleId}/reviews/${existing.id}/edit`);
        }

        await insertReview({
            userId,
            vehicleId,
            rating: data.rating,
            body: data.body
        });

        req.session.flash = { success: 'Thanks—your review was posted.' };
        return res.redirect(`/vehicles/${vehicleId}`);
    } catch (error) {
        return next(error);
    }
};

const showEditReview = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.vehicleId);
        const reviewId = parsePositiveInt(req.params.reviewId);
        if (!vehicleId || !reviewId) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        const review = await getReviewById(reviewId);
        const vehicle = await getVehicleById(vehicleId);
        if (!review || !vehicle || review.vehicle_id !== vehicleId || review.user_id !== req.session.user.id) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        res.render('reviews/edit', {
            title: `Edit review – ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle,
            review,
            form: { rating: String(review.rating), body: review.body },
            fieldErrors: {},
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

const updateReview = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.vehicleId);
        const reviewId = parsePositiveInt(req.params.reviewId);
        if (!vehicleId || !reviewId) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        const review = await getReviewById(reviewId);
        const vehicle = await getVehicleById(vehicleId);
        if (!review || !vehicle || review.vehicle_id !== vehicleId || review.user_id !== req.session.user.id) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        const { data, fieldErrors } = parseReviewPayload(req.body);
        if (!data) {
            const rawRating = req.body?.rating;
            const ratingVal =
                rawRating === undefined || rawRating === null ? '' : String(rawRating);
            const bodyVal = typeof req.body?.body === 'string' ? req.body.body : '';
            return res.render('reviews/edit', {
                title: `Edit review – ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                vehicle,
                review,
                form: { rating: ratingVal, body: bodyVal },
                fieldErrors,
                error: 'Please fix the highlighted fields.'
            });
        }

        const updated = await patchReview({
            reviewId,
            userId: req.session.user.id,
            rating: data.rating,
            body: data.body
        });

        if (!updated) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        req.session.flash = { success: 'Your review was updated.' };
        return res.redirect(`/vehicles/${vehicleId}`);
    } catch (error) {
        return next(error);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.vehicleId);
        const reviewId = parsePositiveInt(req.params.reviewId);
        if (!vehicleId || !reviewId) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        const review = await getReviewById(reviewId);
        if (!review || review.vehicle_id !== vehicleId) {
            const err = new Error('Page not found');
            err.status = 404;
            throw err;
        }

        const user = req.session.user;
        const role = user.role;
        const isStaff = staffRoles.has(role);
        const isAuthor = review.user_id === user.id;

        if (isStaff) {
            await deleteReviewById(reviewId);
            req.session.flash = { success: 'Review removed.' };
            return res.redirect(`/vehicles/${vehicleId}`);
        }

        if (isAuthor) {
            const removed = await deleteReviewForUser({ reviewId, userId: user.id });
            if (!removed) {
                const err = new Error('Page not found');
                err.status = 404;
                throw err;
            }
            req.session.flash = { success: 'Your review was deleted.' };
            return res.redirect(`/vehicles/${vehicleId}`);
        }

        req.session.flash = { error: 'You cannot delete that review.' };
        return res.redirect(`/vehicles/${vehicleId}`);
    } catch (error) {
        return next(error);
    }
};

export { showNewReview, createReview, showEditReview, updateReview, deleteReview };
