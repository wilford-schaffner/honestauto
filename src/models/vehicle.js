import db from './db.js';
import { listImagesByVehicleId } from './vehicleImage.js';

/**
 * List vehicles, optionally filtered by category.
 * Includes category info and a deterministic "primary" image (first by sort_order).
 *
 * @param {{ categoryId?: number | null, sortKey?: string }} [options]
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
const sortMap = {
        newest: 'v.created_at DESC, v.id DESC',
        oldest: 'v.created_at ASC, v.id ASC',
        price_asc: 'v.price ASC, v.id ASC',
        price_desc: 'v.price DESC, v.id DESC',
        mileage_asc: 'v.mileage ASC NULLS LAST, v.id ASC',
        mileage_desc: 'v.mileage DESC NULLS LAST, v.id DESC',
        year_desc: 'v.year DESC, v.id DESC',
        year_asc: 'v.year ASC, v.id ASC',
        make: 'v.make ASC, v.model ASC, v.year DESC, v.id ASC'
    };

const listVehicles = async ({ categoryId = null, sortKey = 'newest' } = {}) => {
    const orderByClause = sortMap[sortKey] ?? sortMap.newest;
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
            v.created_at,
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
        ORDER BY ${orderByClause}
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
        createdAt: row.created_at,
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
 * List featured vehicles for the home page.
 * @param {{ limit?: number }} [options]
 */
const listFeaturedVehicles = async ({ limit = 6 } = {}) => {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 12) : 6;
    const orderByClause = sortMap.newest;
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
            v.created_at,
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
        ORDER BY ${orderByClause}
        LIMIT $1
        `,
        [safeLimit]
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
        createdAt: row.created_at,
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

const createVehicle = async ({
    categoryId,
    make,
    model,
    year,
    price,
    description,
    mileage,
    available
}) => {
    const result = await db.query(
        `INSERT INTO vehicles
            (category_id, make, model, year, price, description, mileage, available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [categoryId, make, model, year, price, description, mileage, available]
    );

    return result.rows[0] || null;
};

const updateVehicleById = async ({
    vehicleId,
    categoryId,
    make,
    model,
    year,
    price,
    description,
    mileage,
    available
}) => {
    const result = await db.query(
        `UPDATE vehicles
         SET
            category_id = $2,
            make = $3,
            model = $4,
            year = $5,
            price = $6,
            description = $7,
            mileage = $8,
            available = $9,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id`,
        [vehicleId, categoryId, make, model, year, price, description, mileage, available]
    );

    return result.rows[0] || null;
};

const updateVehicleForEmployeeById = async ({ vehicleId, price, description, available }) => {
    const result = await db.query(
        `UPDATE vehicles
         SET
            price = $2,
            description = $3,
            available = $4,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id`,
        [vehicleId, price, description, available]
    );

    return result.rows[0] || null;
};

const deleteVehicleById = async (vehicleId) => {
    const result = await db.query(`DELETE FROM vehicles WHERE id = $1`, [vehicleId]);
    return result.rowCount > 0;
};

export {
    listVehicles,
    listFeaturedVehicles,
    getVehicleById,
    createVehicle,
    updateVehicleById,
    updateVehicleForEmployeeById,
    deleteVehicleById
};
