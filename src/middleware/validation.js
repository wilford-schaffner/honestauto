import {
    sanitizeReviewBody,
    REVIEW_BODY_MAX_LENGTH,
    SERVICE_REQUEST_TITLE_MAX_LENGTH,
    SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH,
    sanitizeServiceRequestTitle,
    sanitizeServiceRequestDescription,
    AUTH_NAME_MAX_LENGTH,
    AUTH_EMAIL_MAX_LENGTH,
    AUTH_PASSWORD_MIN_LENGTH,
    AUTH_PASSWORD_MAX_LENGTH,
    CONTACT_NAME_MAX_LENGTH,
    CONTACT_SUBJECT_MAX_LENGTH,
    CONTACT_MESSAGE_MAX_LENGTH,
    sanitizePersonName,
    sanitizeEmail,
    sanitizeContactSubject,
    sanitizeContactMessage
} from '../utils/sanitize.js';

/**
 * @param {import('express').Request['body']} body
 * @returns {{ data: { rating: number, body: string } | null, fieldErrors: Record<string, string> }}
 */
const parseReviewPayload = (body) => {
    const fieldErrors = {};

    const rawRating = body?.rating;
    const rating =
        typeof rawRating === 'string'
            ? Number.parseInt(rawRating, 10)
            : typeof rawRating === 'number'
              ? Math.trunc(rawRating)
              : NaN;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        fieldErrors.rating = 'Please choose a rating from 1 to 5.';
    }

    const text = sanitizeReviewBody(body?.body);
    if (text.length === 0) {
        fieldErrors.body = 'Please write your review.';
    } else if (text.length > REVIEW_BODY_MAX_LENGTH) {
        fieldErrors.body = `Reviews must be at most ${REVIEW_BODY_MAX_LENGTH} characters.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { data: null, fieldErrors };
    }

    return { data: { rating, body: text }, fieldErrors: {} };
};

export { parseReviewPayload };

/**
 * @param {import('express').Request['body']} body
 * @returns {{ data: { title: string, vehicle_id: number | null, description: string } | null, fieldErrors: Record<string, string> }}
 */
const parseServiceRequestPayload = (body) => {
    const fieldErrors = {};

    const title = sanitizeServiceRequestTitle(body?.title);
    if (title.length === 0) {
        fieldErrors.title = 'Please enter a request title.';
    } else if (title.length > SERVICE_REQUEST_TITLE_MAX_LENGTH) {
        fieldErrors.title = `Titles must be at most ${SERVICE_REQUEST_TITLE_MAX_LENGTH} characters.`;
    }

    const description = sanitizeServiceRequestDescription(body?.description);
    if (description.length === 0) {
        fieldErrors.description = 'Please enter a description of the service you need.';
    } else if (description.length > SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH) {
        fieldErrors.description = `Descriptions must be at most ${SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH} characters.`;
    }

    const rawVehicleId = body?.vehicle_id;
    let vehicle_id = null;

    if (rawVehicleId === '' || rawVehicleId === undefined || rawVehicleId === null) {
        vehicle_id = null;
    } else {
        const parsed =
            typeof rawVehicleId === 'string'
                ? Number.parseInt(rawVehicleId, 10)
                : typeof rawVehicleId === 'number'
                  ? Math.trunc(rawVehicleId)
                  : NaN;

        if (!Number.isInteger(parsed) || parsed <= 0) {
            fieldErrors.vehicle_id = 'Please select a valid vehicle (or leave it as not specified).';
        } else {
            vehicle_id = parsed;
        }
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { data: null, fieldErrors };
    }

    return { data: { title, vehicle_id, description }, fieldErrors: {} };
};

export { parseServiceRequestPayload };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s'-]+$/;

/**
 * @param {import('express').Request['body']} body
 * @returns {{ data: { email: string, password: string } | null, fieldErrors: Record<string, string> }}
 */
const parseLoginPayload = (body) => {
    const fieldErrors = {};
    const email = sanitizeEmail(body?.email);
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !EMAIL_REGEX.test(email) || email.length > AUTH_EMAIL_MAX_LENGTH) {
        fieldErrors.email = 'Please enter a valid email address.';
    }

    if (!password || password.length < AUTH_PASSWORD_MIN_LENGTH || password.length > AUTH_PASSWORD_MAX_LENGTH) {
        fieldErrors.password = `Password must be between ${AUTH_PASSWORD_MIN_LENGTH} and ${AUTH_PASSWORD_MAX_LENGTH} characters.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { data: null, fieldErrors };
    }

    return { data: { email, password }, fieldErrors: {} };
};

/**
 * @param {import('express').Request['body']} body
 * @returns {{ data: { name: string, email: string, password: string, confirmPassword: string } | null, fieldErrors: Record<string, string> }}
 */
const parseRegisterPayload = (body) => {
    const fieldErrors = {};

    const name = sanitizePersonName(body?.name);
    const email = sanitizeEmail(body?.email);
    const password = typeof body?.password === 'string' ? body.password : '';
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!name || name.length > AUTH_NAME_MAX_LENGTH || !NAME_REGEX.test(name)) {
        fieldErrors.name = 'Please enter a valid name (letters, spaces, apostrophes, and hyphens only).';
    }
    if (!email || !EMAIL_REGEX.test(email) || email.length > AUTH_EMAIL_MAX_LENGTH) {
        fieldErrors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < AUTH_PASSWORD_MIN_LENGTH || password.length > AUTH_PASSWORD_MAX_LENGTH) {
        fieldErrors.password = `Password must be between ${AUTH_PASSWORD_MIN_LENGTH} and ${AUTH_PASSWORD_MAX_LENGTH} characters.`;
    }
    if (confirmPassword !== password) {
        fieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { data: null, fieldErrors };
    }

    return { data: { name, email, password, confirmPassword }, fieldErrors: {} };
};

/**
 * @param {import('express').Request['body']} body
 * @returns {{ data: { name: string, email: string, subject: string, message: string } | null, fieldErrors: Record<string, string> }}
 */
const parseContactPayload = (body) => {
    const fieldErrors = {};

    const name = sanitizePersonName(body?.name);
    const email = sanitizeEmail(body?.email);
    const subject = sanitizeContactSubject(body?.subject);
    const message = sanitizeContactMessage(body?.message);

    if (!name || name.length > CONTACT_NAME_MAX_LENGTH) {
        fieldErrors.name = `Please enter your name (up to ${CONTACT_NAME_MAX_LENGTH} characters).`;
    }
    if (!email || !EMAIL_REGEX.test(email) || email.length > AUTH_EMAIL_MAX_LENGTH) {
        fieldErrors.email = 'Please enter a valid email address.';
    }
    if (!subject || subject.length > CONTACT_SUBJECT_MAX_LENGTH) {
        fieldErrors.subject = `Please enter a subject (up to ${CONTACT_SUBJECT_MAX_LENGTH} characters).`;
    }
    if (!message || message.length > CONTACT_MESSAGE_MAX_LENGTH) {
        fieldErrors.message = `Please enter a message (up to ${CONTACT_MESSAGE_MAX_LENGTH} characters).`;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { data: null, fieldErrors };
    }

    return { data: { name, email, subject, message }, fieldErrors: {} };
};

export { parseLoginPayload, parseRegisterPayload, parseContactPayload };
