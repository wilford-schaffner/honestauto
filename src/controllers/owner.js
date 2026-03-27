import {
    createVehicle,
    deleteVehicleById,
    getVehicleById,
    listVehicles,
    updateVehicleById
} from '../models/vehicle.js';
import {
    createCategory,
    deleteCategoryById,
    getCategoryById,
    listCategories,
    updateCategoryById
} from '../models/category.js';
import { listUsersForManagement, ROLES, updateUserRoleById } from '../models/user.js';
import { listContactMessages } from '../models/contactMessage.js';
import { listServiceRequestsForStaff } from '../models/serviceRequest.js';
import { listReviewsForModeration } from '../models/review.js';

const parsePositiveInt = (raw) => {
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value > 0 ? value : null;
};

const sanitizeText = (raw, maxLength) => {
    const value = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
    return value.slice(0, maxLength);
};

const slugify = (value) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const showOwnerDashboard = async (req, res, next) => {
    try {
        const [vehicles, users, requests, messages, reviews] = await Promise.all([
            listVehicles({ sortKey: 'newest' }),
            listUsersForManagement(),
            listServiceRequestsForStaff(),
            listContactMessages(),
            listReviewsForModeration()
        ]);

        res.render('dashboard/owner/index', {
            title: 'Owner dashboard – Honest Auto',
            totals: {
                vehicles: vehicles.length,
                users: users.length,
                openRequests: requests.filter((item) => item.status !== 'completed').length,
                reviews: reviews.length
            },
            contactMessages: messages,
            contactMessagesActionBase: '/dashboard/owner'
        });
    } catch (error) {
        next(error);
    }
};

const showOwnerVehicles = async (req, res, next) => {
    try {
        const vehicles = await listVehicles({ sortKey: 'newest' });
        res.render('dashboard/owner/vehicles', {
            title: 'Inventory – Honest Auto',
            vehicles
        });
    } catch (error) {
        next(error);
    }
};

const showNewOwnerVehicle = async (req, res, next) => {
    try {
        const categories = await listCategories();
        res.render('dashboard/owner/vehicle-new', {
            title: 'Add vehicle – Honest Auto',
            categories,
            form: {
                category_id: '',
                make: '',
                model: '',
                year: '',
                price: '',
                mileage: '',
                description: '',
                available: 'true'
            },
            fieldErrors: {},
            error: null
        });
    } catch (error) {
        next(error);
    }
};

const parseVehicleForm = (body) => {
    const categoryId = parsePositiveInt(body.category_id);
    const make = sanitizeText(body.make, 100);
    const model = sanitizeText(body.model, 100);
    const description = sanitizeText(body.description, 4000);
    const year = Number.parseInt(typeof body.year === 'string' ? body.year : '', 10);
    const price = Number.parseFloat(typeof body.price === 'string' ? body.price : '');
    const mileageRaw = typeof body.mileage === 'string' ? body.mileage.trim() : '';
    const mileage = mileageRaw.length > 0 ? Number.parseInt(mileageRaw, 10) : null;
    const availableRaw = typeof body.available === 'string' ? body.available : '';
    const available = availableRaw === 'true';

    const fieldErrors = {};
    if (!categoryId) fieldErrors.category_id = 'Please choose a category.';
    if (make.length === 0) fieldErrors.make = 'Please enter make.';
    if (model.length === 0) fieldErrors.model = 'Please enter model.';
    if (!Number.isInteger(year) || year < 1900) fieldErrors.year = 'Please enter a valid year.';
    if (!Number.isFinite(price) || price < 0) fieldErrors.price = 'Please enter a valid price.';
    if (mileage !== null && (!Number.isInteger(mileage) || mileage < 0)) {
        fieldErrors.mileage = 'Mileage must be empty or a non-negative number.';
    }
    if (description.length === 0) fieldErrors.description = 'Please provide a description.';
    if (availableRaw !== 'true' && availableRaw !== 'false') {
        fieldErrors.available = 'Please choose availability.';
    }

    return {
        data: Object.keys(fieldErrors).length
            ? null
            : {
                  categoryId,
                  make,
                  model,
                  year,
                  price,
                  mileage,
                  description,
                  available
              },
        fieldErrors
    };
};

const createOwnerVehicle = async (req, res, next) => {
    try {
        const categories = await listCategories();
        const { data, fieldErrors } = parseVehicleForm(req.body);

        if (!data) {
            res.status(400).render('dashboard/owner/vehicle-new', {
                title: 'Add vehicle – Honest Auto',
                categories,
                form: {
                    category_id: typeof req.body.category_id === 'string' ? req.body.category_id : '',
                    make: typeof req.body.make === 'string' ? req.body.make : '',
                    model: typeof req.body.model === 'string' ? req.body.model : '',
                    year: typeof req.body.year === 'string' ? req.body.year : '',
                    price: typeof req.body.price === 'string' ? req.body.price : '',
                    mileage: typeof req.body.mileage === 'string' ? req.body.mileage : '',
                    description: typeof req.body.description === 'string' ? req.body.description : '',
                    available: typeof req.body.available === 'string' ? req.body.available : 'true'
                },
                fieldErrors,
                error: 'Please fix the highlighted fields and try again.'
            });
            return;
        }

        await createVehicle(data);
        req.session.flash = { success: 'Vehicle added to inventory.' };
        res.redirect('/dashboard/owner/vehicles');
    } catch (error) {
        next(error);
    }
};

const showOwnerVehicleEdit = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.id);
        if (!vehicleId) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const [vehicle, categories] = await Promise.all([getVehicleById(vehicleId), listCategories()]);
        if (!vehicle) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        res.render('dashboard/owner/vehicle-edit', {
            title: `Edit vehicle #${vehicle.id} – Honest Auto`,
            vehicle,
            categories,
            form: {
                category_id: String(vehicle.category.id),
                make: vehicle.make,
                model: vehicle.model,
                year: String(vehicle.year),
                price: String(vehicle.price),
                mileage: vehicle.mileage === null || vehicle.mileage === undefined ? '' : String(vehicle.mileage),
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

const updateOwnerVehicle = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.id);
        if (!vehicleId) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const [vehicle, categories] = await Promise.all([getVehicleById(vehicleId), listCategories()]);
        if (!vehicle) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const { data, fieldErrors } = parseVehicleForm(req.body);
        if (!data) {
            res.status(400).render('dashboard/owner/vehicle-edit', {
                title: `Edit vehicle #${vehicle.id} – Honest Auto`,
                vehicle,
                categories,
                form: {
                    category_id: typeof req.body.category_id === 'string' ? req.body.category_id : '',
                    make: typeof req.body.make === 'string' ? req.body.make : '',
                    model: typeof req.body.model === 'string' ? req.body.model : '',
                    year: typeof req.body.year === 'string' ? req.body.year : '',
                    price: typeof req.body.price === 'string' ? req.body.price : '',
                    mileage: typeof req.body.mileage === 'string' ? req.body.mileage : '',
                    description: typeof req.body.description === 'string' ? req.body.description : '',
                    available: typeof req.body.available === 'string' ? req.body.available : 'true'
                },
                fieldErrors,
                error: 'Please fix the highlighted fields and try again.'
            });
            return;
        }

        await updateVehicleById({ vehicleId, ...data });
        req.session.flash = { success: 'Vehicle updated.' };
        res.redirect('/dashboard/owner/vehicles');
    } catch (error) {
        next(error);
    }
};

const deleteOwnerVehicle = async (req, res, next) => {
    try {
        const vehicleId = parsePositiveInt(req.params.id);
        if (!vehicleId) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        const removed = await deleteVehicleById(vehicleId);
        if (!removed) {
            const err = new Error('Vehicle not found');
            err.status = 404;
            throw err;
        }

        req.session.flash = { success: 'Vehicle removed.' };
        res.redirect('/dashboard/owner/vehicles');
    } catch (error) {
        next(error);
    }
};

const showOwnerCategories = async (req, res, next) => {
    try {
        const categories = await listCategories();
        res.render('dashboard/owner/categories', {
            title: 'Categories – Honest Auto',
            categories,
            form: { name: '' },
            fieldErrors: {},
            error: null
        });
    } catch (error) {
        next(error);
    }
};

const createOwnerCategory = async (req, res, next) => {
    try {
        const name = sanitizeText(req.body.name, 100);
        const slug = slugify(name);
        const fieldErrors = {};
        if (!name) fieldErrors.name = 'Please enter a category name.';
        if (!slug) fieldErrors.name = 'Please enter a valid category name.';

        if (Object.keys(fieldErrors).length > 0) {
            const categories = await listCategories();
            res.status(400).render('dashboard/owner/categories', {
                title: 'Categories – Honest Auto',
                categories,
                form: { name: typeof req.body.name === 'string' ? req.body.name : '' },
                fieldErrors,
                error: 'Please fix the highlighted fields and try again.'
            });
            return;
        }

        await createCategory({ name, slug });
        req.session.flash = { success: 'Category created.' };
        res.redirect('/dashboard/owner/categories');
    } catch (error) {
        next(error);
    }
};

const showOwnerCategoryEdit = async (req, res, next) => {
    try {
        const categoryId = parsePositiveInt(req.params.id);
        if (!categoryId) {
            const err = new Error('Category not found');
            err.status = 404;
            throw err;
        }

        const category = await getCategoryById(categoryId);
        if (!category) {
            const err = new Error('Category not found');
            err.status = 404;
            throw err;
        }

        res.render('dashboard/owner/category-edit', {
            title: `Edit category – Honest Auto`,
            category,
            form: {
                name: category.name
            },
            fieldErrors: {},
            error: null
        });
    } catch (error) {
        next(error);
    }
};

const updateOwnerCategory = async (req, res, next) => {
    try {
        const categoryId = parsePositiveInt(req.params.id);
        if (!categoryId) {
            const err = new Error('Category not found');
            err.status = 404;
            throw err;
        }

        const category = await getCategoryById(categoryId);
        if (!category) {
            const err = new Error('Category not found');
            err.status = 404;
            throw err;
        }

        const name = sanitizeText(req.body.name, 100);
        const slug = slugify(name);
        const fieldErrors = {};
        if (!name || !slug) fieldErrors.name = 'Please enter a valid category name.';

        if (Object.keys(fieldErrors).length > 0) {
            res.status(400).render('dashboard/owner/category-edit', {
                title: `Edit category – Honest Auto`,
                category,
                form: {
                    name: typeof req.body.name === 'string' ? req.body.name : ''
                },
                fieldErrors,
                error: 'Please fix the highlighted fields and try again.'
            });
            return;
        }

        await updateCategoryById({ categoryId, name, slug });
        req.session.flash = { success: 'Category updated.' };
        res.redirect('/dashboard/owner/categories');
    } catch (error) {
        next(error);
    }
};

const deleteOwnerCategory = async (req, res, next) => {
    try {
        const categoryId = parsePositiveInt(req.params.id);
        if (!categoryId) {
            const err = new Error('Category not found');
            err.status = 404;
            throw err;
        }

        const removed = await deleteCategoryById(categoryId);
        if (!removed) {
            const err = new Error('Category not found');
            err.status = 404;
            throw err;
        }

        req.session.flash = { success: 'Category removed.' };
        res.redirect('/dashboard/owner/categories');
    } catch (error) {
        if (error?.code === '23503') {
            req.session.flash = { error: 'Category cannot be deleted while vehicles use it.' };
            res.redirect('/dashboard/owner/categories');
            return;
        }
        next(error);
    }
};

const showOwnerUsers = async (req, res, next) => {
    try {
        const users = await listUsersForManagement();
        res.render('dashboard/owner/users', {
            title: 'Users – Honest Auto',
            users,
            roles: ROLES
        });
    } catch (error) {
        next(error);
    }
};

const updateOwnerUserRole = async (req, res, next) => {
    try {
        const userId = parsePositiveInt(req.params.id);
        const role = typeof req.body.role === 'string' ? req.body.role : '';
        const validRoles = new Set([ROLES.OWNER, ROLES.EMPLOYEE, ROLES.USER]);
        if (!userId || !validRoles.has(role)) {
            req.session.flash = { error: 'Invalid user role update request.' };
            res.redirect('/dashboard/owner/users');
            return;
        }

        const updated = await updateUserRoleById({ userId, role });
        if (!updated) {
            req.session.flash = { error: 'User not found.' };
            res.redirect('/dashboard/owner/users');
            return;
        }

        req.session.flash = { success: 'User role updated.' };
        res.redirect('/dashboard/owner/users');
    } catch (error) {
        next(error);
    }
};

const showOwnerContactSubmissions = async (req, res) => {
    res.redirect('/dashboard/owner');
};

export {
    showOwnerDashboard,
    showOwnerVehicles,
    showNewOwnerVehicle,
    createOwnerVehicle,
    showOwnerVehicleEdit,
    updateOwnerVehicle,
    deleteOwnerVehicle,
    showOwnerCategories,
    createOwnerCategory,
    showOwnerCategoryEdit,
    updateOwnerCategory,
    deleteOwnerCategory,
    showOwnerUsers,
    updateOwnerUserRole,
    showOwnerContactSubmissions
};

