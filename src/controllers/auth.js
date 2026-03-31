import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../models/user.js';
import { parseLoginPayload, parseRegisterPayload } from '../middleware/validation.js';

const showLoginForm = (req, res) => {
    res.render('auth/login', {
        title: 'Log In – Honest Auto',
        error: null,
        form: { email: '' },
        fieldErrors: {}
    });
};

const showRegisterForm = (req, res) => {
    res.render('auth/register', {
        title: 'Create Account – Honest Auto',
        error: null,
        form: { name: '', email: '' },
        fieldErrors: {}
    });
};

const handleLogin = async (req, res, next) => {
    try {
        const { data, fieldErrors } = parseLoginPayload(req.body);

        if (Object.keys(fieldErrors).length > 0) {
            return res.status(400).render('auth/login', {
                title: 'Log In – Honest Auto',
                error: 'Please correct the highlighted fields.',
                form: { email: typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '' },
                fieldErrors
            });
        }

        const { email, password } = data;

        const user = await findUserByEmail(email);
        const passwordIsValid = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !passwordIsValid) {
            return res.status(401).render('auth/login', {
                title: 'Log In – Honest Auto',
                error: 'Invalid email or password.',
                form: { email },
                fieldErrors: {}
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const redirectTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        req.session.flash = { success: `Welcome back, ${user.name}.` };
        return res.redirect(redirectTo);
    } catch (error) {
        return next(error);
    }
};

const handleRegister = async (req, res, next) => {
    try {
        const { data, fieldErrors } = parseRegisterPayload(req.body);

        if (Object.keys(fieldErrors).length > 0) {
            return res.status(400).render('auth/register', {
                title: 'Create Account – Honest Auto',
                error: 'Please correct the highlighted fields.',
                form: {
                    name: typeof req.body?.name === 'string' ? req.body.name.trim() : '',
                    email: typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
                },
                fieldErrors
            });
        }

        const { name, email, password } = data;

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).render('auth/register', {
                title: 'Create Account – Honest Auto',
                error: 'An account with that email already exists.',
                form: { name, email },
                fieldErrors: {}
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser({ name, email, passwordHash });

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        req.session.flash = { success: 'Account created successfully.' };

        const redirectTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        return res.redirect(redirectTo);
    } catch (error) {
        return next(error);
    }
};

const handleLogout = (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie('honestauto.sid');
        return res.redirect('/auth/login');
    });
};

export { showLoginForm, handleLogin, showRegisterForm, handleRegister, handleLogout };

