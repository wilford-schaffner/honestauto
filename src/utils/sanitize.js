const REVIEW_BODY_MAX_LENGTH = 4000;

/**
 * Trim and collapse internal whitespace for review text.
 * @param {unknown} value
 * @returns {string}
 */
const sanitizeReviewBody = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

export { REVIEW_BODY_MAX_LENGTH, sanitizeReviewBody };
