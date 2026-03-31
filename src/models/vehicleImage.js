import db from './db.js';

/**
 * List all images for a vehicle, in deterministic order.
 * @param {number} vehicleId
 * @returns {Promise<Array<{id:number,vehicleId:number,url:string,caption:string|null,sortOrder:number}>>}
 */
const listImagesByVehicleId = async (vehicleId) => {
    const result = await db.query(
        `
        SELECT
            id,
            vehicle_id,
            url,
            caption,
            sort_order
        FROM vehicle_images
        WHERE vehicle_id = $1
        ORDER BY sort_order ASC, id ASC
        `,
        [vehicleId]
    );

    return result.rows.map((row) => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        url: row.url,
        caption: row.caption,
        sortOrder: row.sort_order
    }));
};

/**
 * Delete all images for a vehicle (used when enforcing single primary image).
 * @param {number} vehicleId
 * @returns {Promise<number>} number of rows deleted
 */
const deleteImagesByVehicleId = async (vehicleId) => {
    const result = await db.query(`DELETE FROM vehicle_images WHERE vehicle_id = $1`, [vehicleId]);
    return result.rowCount || 0;
};

/**
 * Create a vehicle image record.
 * @param {{vehicleId:number,url:string,caption?:string|null,sortOrder?:number}} payload
 * @returns {Promise<{id:number}|null>}
 */
const createVehicleImage = async ({ vehicleId, url, caption = null, sortOrder = 1 }) => {
    const normalizedCaption =
        typeof caption === 'string' && caption.trim().length > 0 ? caption.trim().slice(0, 255) : null;

    const result = await db.query(
        `
        INSERT INTO vehicle_images (vehicle_id, url, caption, sort_order)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [vehicleId, url, normalizedCaption, sortOrder]
    );

    return result.rows[0] || null;
};

/**
 * Replace a vehicle's primary image (single-image policy).
 * @param {{vehicleId:number,url:string,caption?:string|null}} payload
 */
const replacePrimaryImage = async ({ vehicleId, url, caption = null }) => {
    await deleteImagesByVehicleId(vehicleId);
    return createVehicleImage({ vehicleId, url, caption, sortOrder: 1 });
};

export { listImagesByVehicleId, deleteImagesByVehicleId, createVehicleImage, replacePrimaryImage };
