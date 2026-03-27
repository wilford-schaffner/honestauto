import {
    toggleContactMessageResolvedById,
    resolveAllContactMessages
} from '../models/contactMessage.js';

const parsePositiveInt = (raw) => {
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value > 0 ? value : null;
};

const makePostToggleContactMessageResolved = (redirectPath) => async (req, res, next) => {
    try {
        const messageId = parsePositiveInt(req.params.id);
        if (!messageId) {
            const err = new Error('Message not found');
            err.status = 404;
            throw err;
        }

        const row = await toggleContactMessageResolvedById(messageId);
        if (!row) {
            const err = new Error('Message not found');
            err.status = 404;
            throw err;
        }

        res.redirect(redirectPath);
    } catch (error) {
        next(error);
    }
};

const makePostResolveAllContactMessages = (redirectPath) => async (req, res, next) => {
    try {
        await resolveAllContactMessages();
        req.session.flash = { success: 'All messages marked as resolved.' };
        res.redirect(redirectPath);
    } catch (error) {
        next(error);
    }
};

export { makePostToggleContactMessageResolved, makePostResolveAllContactMessages };
