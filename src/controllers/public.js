import db from '../models/db.js';
import { listCategories } from '../models/category.js';
import { listVehicles, listFeaturedVehicles, getVehicleById } from '../models/vehicle.js';
import { createContactMessage } from '../models/contactMessage.js';

const listVehiclesPlain = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT id, make, model, year, price FROM vehicles ORDER BY id'
        );

        if (!result.rows.length) {
            res.type('text/plain').send('No vehicles found.');
            return;
        }

        const lines = result.rows.map((vehicle) => {
            const { id, make, model, year, price } = vehicle;
            const formattedPrice =
                price !== null && price !== undefined
                    ? `$${Number(price).toFixed(2)}`
                    : '';
            const details = `${year} ${make} ${model}`.trim();
            return formattedPrice
                ? `${id}. ${details} - ${formattedPrice}`
                : `${id}. ${details}`;
        });

        res.type('text/plain').send(lines.join('\n'));
    } catch (error) {
        next(error);
    }
};

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
            title: 'Browse vehicles – Honest Auto',
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

        res.render('vehicles/detail', {
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model} – Honest Auto`,
            vehicle
        });
    } catch (error) {
        next(error);
    }
};

const showContactForm = (req, res) => {
    res.render('contact/index', {
        title: 'Contact – Honest Auto',
        form: {
            name: '',
            email: '',
            subject: '',
            message: ''
        },
        fieldErrors: {}
    });
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const handleContactSubmit = async (req, res, next) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
        const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

        const fieldErrors = {};

        if (!isNonEmptyString(name)) fieldErrors.name = 'Please enter your name.';
        if (!isNonEmptyString(email) || !email.includes('@')) fieldErrors.email = 'Please enter a valid email.';
        if (!isNonEmptyString(subject)) fieldErrors.subject = 'Please enter a subject.';
        if (!isNonEmptyString(message)) fieldErrors.message = 'Please enter a message.';

        const hasErrors = Object.keys(fieldErrors).length > 0;
        if (hasErrors) {
            res.status(400).render('contact/index', {
                title: 'Contact – Honest Auto',
                error: 'Please fix the highlighted fields and try again.',
                form: { name, email, subject, message },
                fieldErrors
            });
            return;
        }

        await createContactMessage({ name, email, subject, message });

        res.render('contact/index', {
            title: 'Contact – Honest Auto',
            success: 'Message received. We’ll get back to you soon.',
            form: { name: '', email: '', subject: '', message: '' },
            fieldErrors: {}
        });
    } catch (error) {
        next(error);
    }
};

export {
    listVehiclesPlain,
    showHome,
    showVehiclesBrowse,
    showVehicleDetail,
    showContactForm,
    handleContactSubmit
};
