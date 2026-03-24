const requireAuth = (req, res, next) => {
    if (req.session?.user) {
        return next();
    }

    if (req.session) {
        req.session.returnTo = req.originalUrl;
        req.session.flash = { info: 'Please log in to continue.' };
    }

    return res.redirect('/auth/login');
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const role = req.session?.user?.role;

        if (!role) {
            if (req.session) {
                req.session.returnTo = req.originalUrl;
                req.session.flash = { info: 'Please log in to continue.' };
            }
            return res.redirect('/auth/login');
        }

        if (allowedRoles.includes(role)) {
            return next();
        }

        if (req.session) {
            req.session.flash = { error: 'You do not have access to that page.' };
        }
        return res.redirect('/');
    };
};

export { requireAuth, requireRole };
