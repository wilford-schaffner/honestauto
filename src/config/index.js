const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const isProduction = NODE_ENV === 'production';

const getSessionSecret = () => {
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

    if (isProduction) {
        throw new Error('SESSION_SECRET is required in production.');
    }

    console.warn('[Honest Auto] SESSION_SECRET is not set. Using a development fallback secret.');
    return 'dev-only-change-me';
};

const sessionConfig = {
    name: 'honestauto.sid',
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 8
    }
};

export { sessionConfig, isProduction };
