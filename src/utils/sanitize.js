const REVIEW_BODY_MAX_LENGTH = 4000;
const SERVICE_REQUEST_TITLE_MAX_LENGTH = 120;
const SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH = 4000;

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

export {
    REVIEW_BODY_MAX_LENGTH,
    sanitizeReviewBody,
    SERVICE_REQUEST_TITLE_MAX_LENGTH,
    SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH,
    sanitizeServiceRequestTitle,
    sanitizeServiceRequestDescription
};
