import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupDatabase, testConnection } from './models/setup.js';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

const app = express();

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple request logging so we can see incoming hits
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount router for all application routes
app.use('/', routes);

// 404 handler
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Global error handler
app.use((err, req, res, next) => {
    if (res.headersSent || res.finished) {
        return next(err);
    }

    const status = err.status || 500;
    const message =
        NODE_ENV === 'production'
            ? 'An error occurred'
            : `${err.message || 'Error'}\n\n${err.stack || ''}`;

    res.status(status).type('text/plain').send(message);
});

app.listen(PORT, async () => {
    await setupDatabase();
    await testConnection();
    console.log(`[Honest Auto] Server is running on http://127.0.0.1:${PORT}`);
});
