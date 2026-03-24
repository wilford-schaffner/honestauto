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

    const context = {
        title: status === 404 ? 'Page not found' : 'Server error',
        error: NODE_ENV === 'production' ? 'An error occurred' : err.message || 'Error',
        stack: NODE_ENV === 'production' ? null : err.stack || null,
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

