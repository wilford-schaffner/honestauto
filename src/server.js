import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupDatabase, testConnection } from './models/setup.js';
import routes from './routes/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { sessionConfig } from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

const app = express();
app.set('trust proxy', 1);

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple request logging so we can see incoming hits
app.use((req, res, next) => {
    if (NODE_ENV !== 'production') {
        console.log(`${req.method} ${req.url}`);
    }
    next();
});

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session(sessionConfig));
app.use((req, res, next) => {
    res.locals.currentUser = req.session?.user || null;

    if (req.session?.flash) {
        res.locals.flash = req.session.flash;
        delete req.session.flash;
    } else {
        res.locals.flash = null;
    }

    next();
});

// Static assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount router for all application routes
app.use('/', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, async () => {
    await setupDatabase();
    await testConnection();
    console.log(`[Honest Auto] Server is running on http://127.0.0.1:${PORT}`);
});
