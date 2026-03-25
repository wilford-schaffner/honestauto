import { sanitizeReviewBody, REVIEW_BODY_MAX_LENGTH } from '../utils/sanitize.js';

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
