import db from './db.js';

/**
 * Create a contact message submission.
 * @param {{ name: string, email: string, subject: string, message: string }} input
 */
const createContactMessage = async ({ name, email, subject, message }) => {
    const result = await db.query(
        `
        INSERT INTO contact_messages (name, email, subject, message)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [name, email, subject, message]
    );

    return result.rows[0]?.id ?? null;
};

export { createContactMessage };

