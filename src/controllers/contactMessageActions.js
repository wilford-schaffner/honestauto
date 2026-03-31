import { toggleContactMessageResolvedById } from '../models/contactMessage.js';

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

        req.session.flash = {
            success: row.resolved ? 'Message marked as resolved.' : 'Message marked as unresolved.'
        };
        res.redirect(redirectPath);
    } catch (error) {
        next(error);
    }
};

export { makePostToggleContactMessageResolved };
