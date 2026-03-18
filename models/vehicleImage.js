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

export { listImagesByVehicleId };
