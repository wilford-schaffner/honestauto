import db from './db.js';
import { listImagesByVehicleId } from './vehicleImage.js';

/**
 * List vehicles, optionally filtered by category.
 * Includes category info and a deterministic "primary" image (first by sort_order).
 *
 * @param {{ categoryId?: number | null }} [options]
 * @returns {Promise<Array<{
 *  id:number,
 *  make:string,
 *  model:string,
 *  year:number,
 *  price:number,
 *  description:string|null,
 *  mileage:number|null,
 *  available:boolean,
 *  category:{id:number,name:string,slug:string},
 *  primaryImage: {id:number,url:string,caption:string|null,sortOrder:number} | null
 * }>>}
 */
const listVehicles = async ({ categoryId = null } = {}) => {
    const result = await db.query(
        `
        SELECT
            v.id,
            v.category_id,
            v.make,
            v.model,
            v.year,
            v.price,
            v.description,
            v.mileage,
            v.available,
            c.name AS category_name,
            c.slug AS category_slug,
            img.id AS primary_image_id,
            img.url AS primary_image_url,
            img.caption AS primary_image_caption,
            img.sort_order AS primary_image_sort_order
        FROM vehicles v
        JOIN categories c ON c.id = v.category_id
        LEFT JOIN LATERAL (
            SELECT
                id,
                url,
                caption,
                sort_order
            FROM vehicle_images
            WHERE vehicle_id = v.id
            ORDER BY sort_order ASC, id ASC
            LIMIT 1
        ) img ON true
        WHERE ($1::int IS NULL OR v.category_id = $1)
        ORDER BY v.id ASC
        `,
        [categoryId]
    );

    return result.rows.map((row) => ({
        id: row.id,
        make: row.make,
        model: row.model,
        year: row.year,
        price: row.price !== null && row.price !== undefined ? Number(row.price) : row.price,
        description: row.description,
        mileage: row.mileage,
        available: row.available,
        category: {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug
        },
        primaryImage: row.primary_image_id
            ? {
                  id: row.primary_image_id,
                  url: row.primary_image_url,
                  caption: row.primary_image_caption,
                  sortOrder: row.primary_image_sort_order
              }
            : null
    }));
};

/**
 * Get a single vehicle by id with its category and all images.
 *
 * @param {number} vehicleId
 * @returns {Promise<{
 *  id:number,
 *  make:string,
 *  model:string,
 *  year:number,
 *  price:number,
 *  description:string|null,
 *  mileage:number|null,
 *  available:boolean,
 *  category:{id:number,name:string,slug:string},
 *  images:Array<{id:number,vehicleId:number,url:string,caption:string|null,sortOrder:number}>
 * } | null>}
 */
const getVehicleById = async (vehicleId) => {
    const result = await db.query(
        `
        SELECT
            v.id,
            v.category_id,
            v.make,
            v.model,
            v.year,
            v.price,
            v.description,
            v.mileage,
            v.available,
            c.name AS category_name,
            c.slug AS category_slug
        FROM vehicles v
        JOIN categories c ON c.id = v.category_id
        WHERE v.id = $1
        LIMIT 1
        `,
        [vehicleId]
    );

    const row = result.rows[0];
    if (!row) {
        return null;
    }

    const images = await listImagesByVehicleId(vehicleId);

    return {
        id: row.id,
        make: row.make,
        model: row.model,
        year: row.year,
        price: row.price !== null && row.price !== undefined ? Number(row.price) : row.price,
        description: row.description,
        mileage: row.mileage,
        available: row.available,
        category: {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug
        },
        images
    };
};

export { listVehicles, getVehicleById };
