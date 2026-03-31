import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up the database by running the seed.sql file if needed.
 * Checks if the users table has data - if not, runs a full seed.
 */
const setupDatabase = async () => {
    let hasData = false;
    let usersTableExists = true;

    try {
        const result = await db.query(
            'SELECT EXISTS (SELECT 1 FROM users LIMIT 1) AS has_data'
        );
        hasData = result.rows[0]?.has_data || false;
    } catch (error) {
        // If the query fails because the table doesn't exist yet, apply schema.sql first.
        // pg error code for "undefined_table" is 42P01.
        if (error?.code === '42P01') {
            usersTableExists = false;
            hasData = false;
        } else {
            throw error;
        }
    }

    if (hasData) {
        console.log('Database already seeded');
        return true;
    }

    if (!usersTableExists) {
        console.log('Users table missing; applying schema...');

        const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schemaSQL);
    }

    console.log('Seeding database...');

    const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    await db.query(seedSQL);

    console.log('Database seeded successfully');

    return true;
};

/**
 * Tests the database connection by executing a simple query.
 */
const testConnection = async () => {
    const result = await db.query('SELECT NOW() AS current_time');
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
};

export { setupDatabase, testConnection };

