import {
    sanitizeReviewBody,
    REVIEW_BODY_MAX_LENGTH,
    SERVICE_REQUEST_TITLE_MAX_LENGTH,
    SERVICE_REQUEST_DESCRIPTION_MAX_LENGTH,
    sanitizeServiceRequestTitle,
    sanitizeServiceRequestDescription
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
