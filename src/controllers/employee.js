import { listVehicles, getVehicleById, updateVehicleForEmployeeById } from '../models/vehicle.js';
import { listReviewsForModeration, deleteReviewById } from '../models/review.js';
import {
    SERVICE_REQUEST_STATUSES,
    getServiceRequestByIdForStaff,
    listServiceRequestStatusEventsForRequest,
    listServiceRequestsForStaff,
    updateServiceRequestByStaff
} from '../models/serviceRequest.js';
import { listContactMessages } from '../models/contactMessage.js';
import { ROLES } from '../models/user.js';

const parsePositiveInt = (raw) => {
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value > 0 ? value : null;
};

const normalizeText = (raw, maxLength) => {
    const value = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
    return value.slice(0, maxLength);
};

const showEmployeeDashboard = async (req, res, next) => {
    try {
        const [vehicles, requests, messages, reviews] = await Promise.all([
            listVehicles({ sortKey: 'newest' }),
            listServiceRequestsForStaff(),
            listContactMessages(),
            listReviewsForModeration()
        ]);

        res.render('dashboard/employee/index', {
            title: 'Employee Dashboard – Honest Auto',
            totals: {
                vehicles: vehicles.length,
                openRequests: requests.filter((item) => item.status !== 'completed').length,
                reviews: reviews.length
            },
            contactMessages: messages,
            contactMessagesActionBase: '/dashboard/employee'
        });
    } catch (error) {
        next(error);
    }
};

const showEmployeeVehicles = async (req, res, next) => {
    try {
        const vehicles = await listVehicles({ sortKey: 'newest' });
        res.render('dashboard/employee/vehicles', {
            title: 'Vehicles – Honest Auto',
            vehicles
        });
    } catch (error) {
        next(error);
    }
};

const showEmployeeVehicleEdit = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.id);
        if (!vehicleId) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const vehicle = await getVehicleById(vehicleId);
        if (!vehicle) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        res.render('dashboard/employee/vehicle-edit', {
            title: `Edit Vehicle #${vehicle.id} – Honest Auto`,
            vehicle,
            form: {
                price: vehicle.price,
                description: vehicle.description || '',
                available: vehicle.available ? 'true' : 'false'
            },
            fieldErrors: {},
            error: null
        });
    } catch (error) {
        next(error);
    }
};

const updateEmployeeVehicle = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.id);
        if (!vehicleId) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const existingVehicle = await getVehicleById(vehicleId);
        if (!existingVehicle) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const rawPrice = typeof req.body.price === 'string' ? req.body.price.trim() : '';
        const price = Number.parseFloat(rawPrice);
        const description = normalizeText(req.body.description, 4000);
        const availableRaw = typeof req.body.available === 'string' ? req.body.available : '';
        const available = availableRaw === 'true';

        const fieldErrors = {};
        if (!Number.isFinite(price) || price < 0) {
            fieldErrors.price = 'Please enter a valid non-negative price.';
        }
        if (description.length === 0) {
            fieldErrors.description = 'Please provide a description.';
        }
        if (availableRaw !== 'true' && availableRaw !== 'false') {
            fieldErrors.available = 'Please choose availability.';
        }

        if (Object.keys(fieldErrors).length > 0) {
            res.status(400).render('dashboard/employee/vehicle-edit', {
                title: `Edit Vehicle #${existingVehicle.id} – Honest Auto`,
                vehicle: existingVehicle,
                form: {
                    price: rawPrice,
                    description,
                    available: availableRaw
                },
                fieldErrors,
                error: 'Please fix the highlighted fields and try again.'
            });
            return;
        }

        await updateVehicleForEmployeeById({
            vehicleId,
            price,
            description,
            available
        });

        req.session.flash = { success: 'Vehicle details updated.' };
        res.redirect('/dashboard/employee/vehicles');
    } catch (error) {
        next(error);
    }
};

const showEmployeeReviews = async (req, res, next) => {
    try {
        const reviews = await listReviewsForModeration();
        res.render('dashboard/employee/reviews', {
            title: 'Reviews – Honest Auto',
            reviews
        });
    } catch (error) {
        next(error);
    }
};

const removeEmployeeReview = async (req, res, next) => {
    try {
        const reviewId = parsePositiveInt(req.params.id);
        if (!reviewId) {
            const err = new Error('Review not found');
            err.status = 404;
            throw err;
        }

        const removed = await deleteReviewById(reviewId);
        if (!removed) {
            const err = new Error('Review not found');
            err.status = 404;
            throw err;
        }

        req.session.flash = { success: 'Review removed.' };
        res.redirect('/dashboard/employee/reviews');
    } catch (error) {
        next(error);
    }
};

const showEmployeeServiceRequests = async (req, res, next) => {
    try {
        const isOwner = req.session.user.role === ROLES.OWNER;
        const showCompleted =
            req.query.showCompleted === '1' || req.query.showCompleted === 'true';

        const requests = await listServiceRequestsForStaff({
            hideCompleted: !showCompleted,
            sortKey: 'status'
        });

        res.render('dashboard/employee/service-requests', {
            title: 'Open Requests – Honest Auto',
            requests,
            isOwner,
            showCompleted
        });
    } catch (error) {
        next(error);
    }
};

const showEmployeeServiceRequestDetail = async (req, res, next) => {
    try {
        const requestId = parsePositiveInt(req.params.id);
        if (!requestId) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const request = await getServiceRequestByIdForStaff(requestId);
        if (!request) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const events = await listServiceRequestStatusEventsForRequest(requestId);

        res.render('dashboard/employee/service-request-detail', {
            title: `Service Request #${request.id} – Honest Auto`,
            request,
            events,
            statuses: SERVICE_REQUEST_STATUSES,
            staffNotesFieldValue: ''
        });
    } catch (error) {
        next(error);
    }
};

const updateEmployeeServiceRequest = async (req, res, next) => {
    try {
        const requestId = parsePositiveInt(req.params.id);
        if (!requestId) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const status = typeof req.body.status === 'string' ? req.body.status : '';
        const notesInput = normalizeText(req.body.notes, 4000);
        if (!SERVICE_REQUEST_STATUSES.includes(status)) {
            req.session.flash = { error: 'Please choose a valid status.' };
            res.redirect(`/dashboard/employee/service-requests/${requestId}`);
            return;
        }

        const existing = await getServiceRequestByIdForStaff(requestId);
        if (!existing) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const notesToPersist =
            notesInput.length > 0 ? notesInput : existing.notes ?? null;

        const updated = await updateServiceRequestByStaff({
            requestId,
            status,
            notes: notesToPersist,
            actorUserId: req.session.user.id
        });

        if (!updated) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        req.session.flash = { success: 'Service request updated.' };
        res.redirect(`/dashboard/employee/service-requests/${requestId}`);
    } catch (error) {
        next(error);
    }
};

const showEmployeeContactSubmissions = async (req, res) => {
    res.redirect('/dashboard/employee');
};

export {
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
};

