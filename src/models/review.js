import db from './db.js';

/**
 * @param {number} vehicleId
 * @returns {Promise<Array<{
 *   id: number,
 *   user_id: number,
 *   vehicle_id: number,
 *   rating: number,
 *   body: string,
 *   created_at: Date,
 *   author_name: string
 * }>>}
 */
const listReviewsForVehicle = async (vehicleId) => {
    const result = await db.query(
        `SELECT r.id, r.user_id, r.vehicle_id, r.rating, r.body, r.created_at, u.name AS author_name
         FROM reviews r
         INNER JOIN users u ON u.id = r.user_id
         WHERE r.vehicle_id = $1
         ORDER BY r.created_at DESC, r.id DESC`,
        [vehicleId]
    );
    return result.rows;
};

/**
 * List all reviews for staff moderation surfaces.
 * @returns {Promise<Array<{
 *   id:number,
 *   user_id:number,
 *   vehicle_id:number,
 *   rating:number,
 *   body:string,
 *   created_at:Date,
 *   author_name:string,
 *   vehicle_make:string,
 *   vehicle_model:string,
 *   vehicle_year:number
 * }>>}
 */
const listReviewsForModeration = async () => {
    const result = await db.query(
        `SELECT
            r.id,
            r.user_id,
            r.vehicle_id,
            r.rating,
            r.body,
            r.created_at,
            u.name AS author_name,
            v.make AS vehicle_make,
            v.model AS vehicle_model,
            v.year AS vehicle_year
         FROM reviews r
         INNER JOIN users u ON u.id = r.user_id
         INNER JOIN vehicles v ON v.id = r.vehicle_id
         ORDER BY r.created_at DESC, r.id DESC`
    );
    return result.rows;
};

/**
 * @param {number} userId
 * @param {number} vehicleId
 * @returns {Promise<{ id: number, user_id: number, vehicle_id: number, rating: number, body: string, created_at: Date } | null>}
 */
const findReviewByUserAndVehicle = async (userId, vehicleId) => {
    const result = await db.query(
        `SELECT id, user_id, vehicle_id, rating, body, created_at
         FROM reviews
         WHERE user_id = $1 AND vehicle_id = $2
         LIMIT 1`,
        [userId, vehicleId]
    );
    return result.rows[0] || null;
};

/**
 * @param {number} reviewId
 * @returns {Promise<{ id: number, user_id: number, vehicle_id: number, rating: number, body: string, created_at: Date } | null>}
 */
const getReviewById = async (reviewId) => {
    const result = await db.query(
        `SELECT id, user_id, vehicle_id, rating, body, created_at
         FROM reviews
         WHERE id = $1
         LIMIT 1`,
        [reviewId]
    );
    return result.rows[0] || null;
};

/**
 * @param {{ userId: number, vehicleId: number, rating: number, body: string }}
 */
const createReview = async ({ userId, vehicleId, rating, body }) => {
    const result = await db.query(
        `INSERT INTO reviews (user_id, vehicle_id, rating, body)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, vehicle_id, rating, body, created_at`,
        [userId, vehicleId, rating, body]
    );
    return result.rows[0];
};

/**
 * @param {{ reviewId: number, userId: number, rating: number, body: string }}
 * @returns {Promise<{ id: number, user_id: number, vehicle_id: number, rating: number, body: string, created_at: Date } | null>}
 */
const updateReview = async ({ reviewId, userId, rating, body }) => {
    const result = await db.query(
        `UPDATE reviews
         SET rating = $3, body = $4
         WHERE id = $1 AND user_id = $2
         RETURNING id, user_id, vehicle_id, rating, body, created_at`,
        [reviewId, userId, rating, body]
    );
    return result.rows[0] || null;
};

/**
 * @param {{ reviewId: number, userId: number }}
 * @returns {Promise<boolean>}
 */
const deleteReviewForUser = async ({ reviewId, userId }) => {
    const result = await db.query(
        `DELETE FROM reviews
         WHERE id = $1 AND user_id = $2`,
        [reviewId, userId]
    );
    return result.rowCount > 0;
};

/**
 * @param {number} reviewId
 * @returns {Promise<boolean>}
 */
const deleteReviewById = async (reviewId) => {
    const result = await db.query(`DELETE FROM reviews WHERE id = $1`, [reviewId]);
    return result.rowCount > 0;
};

export {
    listReviewsForVehicle,
    listReviewsForModeration,
    findReviewByUserAndVehicle,
    getReviewById,
    createReview,
    updateReview,
    deleteReviewForUser,
    deleteReviewById
};
