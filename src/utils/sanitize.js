const REVIEW_BODY_MAX_LENGTH = 4000;
const SERVICE_REQUEST_TITLE_MAX_LENGTH = 120;
const SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH = 4000;
const AUTH_NAME_MAX_LENGTH = 100;
const AUTH_EMAIL_MAX_LENGTH = 255;
const AUTH_PASSWORD_MIN_LENGTH = 8;
const AUTH_PASSWORD_MAX_LENGTH = 128;
const CONTACT_NAME_MAX_LENGTH = 100;
const CONTACT_SUBJECT_MAX_LENGTH = 255;
const CONTACT_MESSAGE_MAX_LENGTH = 2000;

/**
 * Trim and collapse internal whitespace for review text.
 * @param {unknown} value
 * @returns {string}
 */
const sanitizeReviewBody = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

const sanitizeServiceRequestDescription = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

const sanitizeServiceRequestTitle = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

const sanitizePersonName = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

const sanitizeEmail = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
};

const sanitizeContactSubject = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

const sanitizeContactMessage = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

export {
    REVIEW_BODY_MAX_LENGTH,
    sanitizeReviewBody,
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
};
