import db from './db.js';
import { listVehicles } from './vehicle.js';

/**
 * List all vehicle categories.
 *
 * @returns {Promise<Array<{id:number,name:string,slug:string}>>}
 */
const listCategories = async () => {
    const result = await db.query(
        `
        SELECT
            id,
            name,
            slug
        FROM categories
        ORDER BY id ASC
        `
    );

    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug
    }));
};

/**
 * Get a single category by id.
 *
 * @param {number} categoryId
 * @returns {Promise<{id:number,name:string,slug:string} | null>}
 */
const getCategoryById = async (categoryId) => {
    const result = await db.query(
        `
        SELECT
            id,
            name,
            slug
        FROM categories
        WHERE id = $1
        LIMIT 1
        `,
        [categoryId]
    );

    const row = result.rows[0];
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        slug: row.slug
    };
};

/**
 * Get a category plus its vehicles.
 *
 * @param {number} categoryId
 * @returns {Promise<{id:number,name:string,slug:string,vehicles:Array<unknown>} | null>}
 */
const getCategoryWithVehicles = async (categoryId) => {
    const category = await getCategoryById(categoryId);
    if (!category) {
        return null;
    }

    const vehicles = await listVehicles({ categoryId });
    return {
        ...category,
        vehicles
    };
};

export { listCategories, getCategoryById, getCategoryWithVehicles };
