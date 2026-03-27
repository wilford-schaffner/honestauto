import { listVehicles, getVehicleById } from '../models/vehicle.js';
import {
    createServiceRequest,
    listServiceRequestsForUser,
    getServiceRequestByIdForUser,
    listServiceRequestStatusEventsForRequest,
    cancelServiceRequestForUser
} from '../models/serviceRequest.js';
import { parseServiceRequestPayload } from '../middleware/validation.js';

const showUserDashboard = (req, res) => {
    res.render('user/index', {
        title: 'Your account – Honest Auto'
    });
};

const listServiceRequests = async (req, res, next) => {
    try {
        const requests = await listServiceRequestsForUser(req.session.user.id);

        res.render('user/service-requests', {
            title: 'Your service requests – Honest Auto',
            requests
        });
    } catch (error) {
        next(error);
    }
};

const showNewServiceRequestForm = async (req, res, next) => {
    try {
        const vehicles = await listVehicles({ categoryId: null, sortKey: 'make' });

        const rawVehicleId = req.query.vehicleId;
        const selectedVehicleId =
            typeof rawVehicleId === 'string' && rawVehicleId.trim().length > 0
                ? Number.parseInt(rawVehicleId, 10)
                : NaN;

        const normalizedSelectedVehicleId =
            Number.isInteger(selectedVehicleId) && selectedVehicleId > 0 ? selectedVehicleId : null;

        res.render('user/service-request-new', {
            title: 'New service request – Honest Auto',
            vehicles,
            form: {
                title: '',
                vehicle_id: normalizedSelectedVehicleId ? String(normalizedSelectedVehicleId) : '',
                description: ''
            },
            fieldErrors: {},
            error: null
        });
    } catch (error) {
        next(error);
    }
};

const showServiceRequestDetail = async (req, res, next) => {
    try {
        const requestId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(requestId) || requestId <= 0) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const request = await getServiceRequestByIdForUser({
            requestId,
            userId: req.session.user.id
        });

        if (!request) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const events = await listServiceRequestStatusEventsForRequest(requestId);

        res.render('user/service-request-detail', {
            title: request.title
                ? `${request.title} – Honest Auto`
                : `Service request #${request.id} – Honest Auto`,
            request,
            events
        });
    } catch (error) {
        next(error);
    }
};

const createServiceRequestHandler = async (req, res, next) => {
    try {
        const userId = req.session.user.id;

        const { data, fieldErrors } = parseServiceRequestPayload(req.body);
        const form = {
            title: typeof req.body.title === 'string' ? req.body.title : '',
            vehicle_id: typeof req.body.vehicle_id === 'string' ? req.body.vehicle_id : '',
            description: typeof req.body.description === 'string' ? req.body.description : ''
        };

        const vehicles = await listVehicles({ categoryId: null, sortKey: 'make' });

        if (Object.keys(fieldErrors).length > 0 || !data) {
            res.status(400).render('user/service-request-new', {
                title: 'New service request – Honest Auto',
                vehicles,
                form,
                fieldErrors,
                error: 'Please fix the highlighted fields and try again.'
            });
            return;
        }

        if (data.vehicle_id !== null) {
            const vehicle = await getVehicleById(data.vehicle_id);
            if (!vehicle) {
                res.status(400).render('user/service-request-new', {
                    title: 'New service request – Honest Auto',
                    vehicles,
                    form: {
                        ...form,
                        vehicle_id: String(data.vehicle_id)
                    },
                    fieldErrors: { vehicle_id: 'Please select a valid vehicle (or leave it as not specified).' },
                    error: null
                });
                return;
            }
        }

        const created = await createServiceRequest({
            userId,
            title: data.title,
            vehicleId: data.vehicle_id,
            description: data.description
        });

        req.session.flash = { success: 'Service request submitted. You can track it on your dashboard.' };
        res.redirect(`/user/service-requests/${created.id}`);
    } catch (error) {
        next(error);
    }
};

const cancelServiceRequestHandler = async (req, res, next) => {
    try {
        const requestId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(requestId) || requestId <= 0) {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        const outcome = await cancelServiceRequestForUser({
            requestId,
            userId: req.session.user.id
        });

        if (outcome === 'not_found') {
            const err = new Error('Service request not found');
            err.status = 404;
            throw err;
        }

        if (outcome === 'completed') {
            req.session.flash = { error: 'Completed requests cannot be cancelled.' };
            res.redirect(`/user/service-requests/${requestId}`);
            return;
        }

        req.session.flash = { success: 'Service request cancelled.' };
        res.redirect('/user/service-requests');
    } catch (error) {
        next(error);
    }
};

export {
    showUserDashboard,
    listServiceRequests,
    showNewServiceRequestForm,
    showServiceRequestDetail,
    createServiceRequestHandler,
    cancelServiceRequestHandler
};

