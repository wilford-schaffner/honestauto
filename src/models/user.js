import db from './db.js';

const ROLES = Object.freeze({
    OWNER: 'owner',
    EMPLOYEE: 'employee',
    USER: 'user'
});

const findUserByEmail = async (email) => {
    const result = await db.query(
        `SELECT id, name, email, password, role
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [email]
    );

    return result.rows[0] || null;
};

const findPublicUserById = async (id) => {
    const result = await db.query(
        `SELECT id, name, email, role
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [id]
    );

    return result.rows[0] || null;
};

const createUser = async ({ name, email, passwordHash }) => {
    const result = await db.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, ROLES.USER]
    );

    return result.rows[0];
};

const listUsersForManagement = async () => {
    const result = await db.query(
        `SELECT id, name, email, role, created_at
         FROM users
         ORDER BY created_at DESC, id DESC`
    );

    return result.rows;
};

const updateUserRoleById = async ({ userId, role }) => {
    const result = await db.query(
        `UPDATE users
         SET role = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, name, email, role, created_at`,
        [userId, role]
    );

    return result.rows[0] || null;
};

export {
    ROLES,
    findUserByEmail,
    findPublicUserById,
    createUser,
    listUsersForManagement,
    updateUserRoleById
};
