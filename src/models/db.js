import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CA certificate for secure Postgres connections.
// Expect the cert at: src/bin/byuicse-psql-cert.pem
const caCert = fs.readFileSync(path.join(__dirname, '../bin', 'byuicse-psql-cert.pem'));

// Normalize NODE_ENV so we can safely inspect it
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

// Hosted / course Postgres roles often cap concurrent sessions per DB user very low
// (sometimes 2–5 total across every client: Render, local dev, psql, etc.).
// Default stays at 2; set DB_POOL_MAX when your provider documents a higher limit.
const parsedPoolMax = Number.parseInt(process.env.DB_POOL_MAX ?? '', 10);
const poolMax =
    Number.isFinite(parsedPoolMax) && parsedPoolMax > 0 ? Math.min(parsedPoolMax, 20) : 2;

const pool = new Pool({
    connectionString: process.env.DB_URL,
    max: poolMax,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    ssl: {
        ca: caCert,
        rejectUnauthorized: true,
        checkServerIdentity: () => { return undefined; }
    }
});

/**
 * Run multiple queries in a single transaction.
 * Ensures BEGIN/COMMIT happen on the same underlying DB connection.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 */
const withTransaction = async (callback) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

let db = null;

if (NODE_ENV.includes('dev') && process.env.ENABLE_SQL_LOGGING === 'true') {
    db = {
        async query(text, params) {
            try {
                const start = Date.now();
                const res = await pool.query(text, params);
                const duration = Date.now() - start;
                console.log('Executed query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    duration: `${duration}ms`,
                    rows: res.rowCount
                });
                return res;
            } catch (error) {
                console.error('Error in query:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    error: error.message
                });
                throw error;
            }
        },

        async close() {
            await pool.end();
        }
    };
} else {
    db = pool;
}

const closePool = () => pool.end();

export default db;
export { caCert, withTransaction, closePool };