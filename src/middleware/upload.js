import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images');

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
]);

const safeExtForMime = (mime) => {
    switch (mime) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'image/avif':
            return '.avif';
        default:
            return '';
    }
};

const vehicleImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const ext = safeExtForMime(file.mimetype) || path.extname(file.originalname || '');
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `vehicle-${unique}${ext}`);
    }
});

const vehicleImageUpload = multer({
    storage: vehicleImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            const err = new Error('Please upload a JPG, PNG, WEBP, or AVIF image.');
            err.status = 400;
            cb(err);
            return;
        }
        cb(null, true);
    }
});

const uploadErrorHandler = (err, req, res, next) => {
    if (!err) return next();

    const message =
        err?.code === 'LIMIT_FILE_SIZE'
            ? 'Image is too large. Please upload a file under 5MB.'
            : err?.message || 'Unable to upload image. Please try again.';

    const wrapped = new Error(message);
    wrapped.status = err.status || 400;
    return next(wrapped);
};

export { vehicleImageUpload, uploadErrorHandler };

