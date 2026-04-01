import { listCategories } from '../models/category.js';
import { listVehicles, listFeaturedVehicles, getVehicleById } from '../models/vehicle.js';
import { createContactMessage } from '../models/contactMessage.js';
import { listReviewsForVehicle, findReviewByUserAndVehicle } from '../models/review.js';
import { parseContactPayload } from '../middleware/validation.js';

const showHome = async (req, res, next) => {
    try {
        const featuredVehicles = await listFeaturedVehicles({ limit: 6 });
        res.render('home/index', {
            title: 'Honest Auto – Used Vehicles',
            featuredVehicles
        });
    } catch (error) {
        next(error);
    }
};

const normalizeSortKey = (raw) => {
    const allowedSortKeys = new Set([
        'newest',
        'oldest',
        'price_asc',
        'price_desc',
        'mileage_asc',
        'mileage_desc',
        'year_desc',
        'year_asc',
        'make'
    ]);

    if (typeof raw !== 'string') return 'newest';
    return allowedSortKeys.has(raw) ? raw : 'newest';
};

const showVehiclesBrowse = async (req, res, next) => {
    try {
        const categories = await listCategories();
        const allowedCategorySlugs = new Set(categories.map((c) => c.slug));

        const rawFilter = req.query.filter;
        const filterSlug = typeof rawFilter === 'string' && allowedCategorySlugs.has(rawFilter) ? rawFilter : 'all';

        const sortKey = normalizeSortKey(req.query.sort);

        const categoryId =
            filterSlug === 'all' ? null : categories.find((c) => c.slug === filterSlug)?.id ?? null;

        const vehicles = await listVehicles({ categoryId, sortKey });

        res.render('vehicles/browse', {
            title: 'Browse Vehicles – Honest Auto',
            vehicles,
            categories,
            currentFilter: filterSlug,
            currentSort: sortKey
        });
    } catch (error) {
        next(error);
    }
};

const showVehicleDetail = async (req, res, next) => {
    try {
        const vehicleId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
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

        const reviews = await listReviewsForVehicle(vehicleId);
        let userReview = null;
        if (req.session?.user) {
            userReview = await findReviewByUserAndVehicle(req.session.user.id, vehicleId);
        }

        res.render('vehicles/detail', {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model} – Honest Auto`,
            vehicle,
            reviews,
            userReview,
            reviewForm: { rating: '', body: '' },
            reviewFieldErrors: {},
            reviewFormError: null
        });
    } catch (error) {
        next(error);
    }
};

const showContactForm = (req, res) => {
    const contactForm = req.session?.contactForm || {
        name: '',
        email: '',
        subject: '',
        message: ''
    };
    const contactFieldErrors = req.session?.contactFieldErrors || {};

    if (req.session) {
        delete req.session.contactForm;
        delete req.session.contactFieldErrors;
    }

    res.render('contact/index', {
        title: 'Contact – Honest Auto',
        form: contactForm,
        fieldErrors: contactFieldErrors
    });
};

const handleContactSubmit = async (req, res, next) => {
    try {
        const { data, fieldErrors } = parseContactPayload(req.body);

        const hasErrors = Object.keys(fieldErrors).length > 0;
        if (hasErrors) {
            req.session.flash = { error: 'Please fix the highlighted fields and try again.' };
            req.session.contactForm = {
                name: typeof req.body?.name === 'string' ? req.body.name.trim() : '',
                email: typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '',
                subject: typeof req.body?.subject === 'string' ? req.body.subject.trim() : '',
                message: typeof req.body?.message === 'string' ? req.body.message.trim() : ''
            };
            req.session.contactFieldErrors = fieldErrors;
            return res.redirect('/contact');
        }

        await createContactMessage(data);
        req.session.flash = { success: 'Message received. We will get back to you soon.' };
        return res.redirect('/contact');
    } catch (error) {
        return next(error);
    }
};

export {
    showHome,
    showVehiclesBrowse,
    showVehicleDetail,
    showContactForm,
    handleContactSubmit
};
