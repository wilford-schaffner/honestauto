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

/**
 * List contact submissions for staff dashboards.
 * @returns {Promise<Array<{id:number,name:string,email:string,subject:string,message:string,submitted:Date,resolved:boolean}>>}
 */
const listContactMessages = async () => {
    const result = await db.query(
        `
        SELECT id, name, email, subject, message, submitted, resolved
        FROM contact_messages
        ORDER BY submitted DESC, id DESC
        `
    );

    return result.rows;
};

/**
 * @param {number} messageId
 * @returns {Promise<{ id: number, resolved: boolean } | null>}
 */
const toggleContactMessageResolvedById = async (messageId) => {
    const result = await db.query(
        `
        UPDATE contact_messages
        SET resolved = NOT resolved
        WHERE id = $1
        RETURNING id, resolved
        `,
        [messageId]
    );

    return result.rows[0] ?? null;
};

const resolveAllContactMessages = async () => {
    await db.query(
        `
        UPDATE contact_messages
        SET resolved = TRUE
        WHERE resolved = FALSE
        `
    );
};

export {
    createContactMessage,
    listContactMessages,
    toggleContactMessageResolvedById,
    resolveAllContactMessages
};

