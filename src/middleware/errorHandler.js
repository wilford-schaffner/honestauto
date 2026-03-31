const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

const notFoundHandler = (req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
};

const globalErrorHandler = (err, req, res, next) => {
    if (res.headersSent || res.finished) {
        return next(err);
    }

    const status = err.status || 500;
    const template = status === 404 ? 'errors/404' : 'errors/500';

    const isProduction = NODE_ENV === 'production';
    const context = {
        title: status === 404 ? 'Page Not Found – Honest Auto' : 'Server Error – Honest Auto',
        error: status === 404 ? 'Page Not Found' : 'An unexpected error occurred.',
        debugError: !isProduction ? err.message || null : null,
        stack: !isProduction ? err.stack || null : null,
        NODE_ENV
    };

    try {
        res.status(status).render(template, context);
    } catch (renderErr) {
        if (!res.headersSent) {
            res.status(status).type('text/html').send(`
                <h1>Error ${status}</h1>
                <p>An error occurred.</p>
            `);
        }
    }
};

export { notFoundHandler, globalErrorHandler };

