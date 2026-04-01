import db, { withTransaction } from './db.js';

const SERVICE_REQUEST_STATUSES = ['submitted', 'in_progress', 'completed'];

const SERVICE_REQUEST_STATUS_LABELS = {
    submitted: 'Submitted',
    in_progress: 'In Progress',
    completed: 'Completed'
};

const toStatusLabel = (status) => SERVICE_REQUEST_STATUS_LABELS[status] ?? status;
const STATUS_EVENTS_TABLE = 'service_request_status_events';

const isMissingStatusEventsTableError = (error) =>
    error?.code === '42P01' && String(error?.message || '').includes(STATUS_EVENTS_TABLE);

const statusEventsTableExists = async () => {
    const result = await db.query(`SELECT to_regclass('public.${STATUS_EVENTS_TABLE}') AS relation_name`);
    return Boolean(result.rows[0]?.relation_name);
};

const ensureStatusEventsTable = async () => {
    await db.query(
        `CREATE TABLE IF NOT EXISTS service_request_status_events (
            id SERIAL PRIMARY KEY,
            service_request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL CHECK (status IN ('submitted', 'in_progress', 'completed')),
            note TEXT,
            actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    );
};

const coerceText = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return String(value);
};

const mapRowToServiceRequest = (row) => {
    const vehicle =
        row.vehicle_id !== null && row.vehicle_id !== undefined
            ? {
                  id: row.vehicle_id,
                  year: row.year,
                  make: row.make,
                  model: row.model,
                  category_name: row.category_name
              }
            : null;

    return {
        id: row.id,
        status: row.status,
        status_label: toStatusLabel(row.status),
        title: coerceText(row.title).trim(),
        description: coerceText(row.description),
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        vehicle_id: row.vehicle_id,
        vehicle
    };
};

/**
 * @param {number} userId
 * @returns {Promise<Array<{
 *   id: number,
 *   status: string,
 *   status_label: string,
 *   title: string,
 *   description: string,
 *   notes: string | null,
 *   created_at: Date,
 *   updated_at: Date,
 *   vehicle_id: number | null,
 *   vehicle: { id: number, year: number, make: string, model: string, category_name: string } | null
 * }>>}
 */
const listServiceRequestsForUser = async (userId) => {
    const result = await db.query(
        `SELECT
            sr.id,
            sr.user_id,
            sr.vehicle_id,
            sr.title,
            sr.description,
            sr.status,
            sr.notes,
            sr.created_at,
            sr.updated_at,
            v.year,
            v.make,
            v.model,
            c.name AS category_name
        FROM service_requests sr
        LEFT JOIN vehicles v ON v.id = sr.vehicle_id
        LEFT JOIN categories c ON c.id = v.category_id
        WHERE sr.user_id = $1
        ORDER BY sr.updated_at DESC, sr.id DESC`,
        [userId]
    );

    return result.rows.map((row) => mapRowToServiceRequest(row));
};

/**
 * @param {{ requestId: number, userId: number }} params
 * @returns {Promise<{
 *  id:number,
 *  status:string,
 *  status_label:string,
 *  title:string,
 *  description:string,
 *  notes:string|null,
 *  created_at:Date,
 *  updated_at:Date,
 *  vehicle_id:number|null,
 *  vehicle: { id:number, year:number, make:string, model:string, category_name:string } | null
 * } | null>}
 */
const getServiceRequestByIdForUser = async ({ requestId, userId }) => {
    const result = await db.query(
        `SELECT
            sr.id,
            sr.user_id,
            sr.vehicle_id,
            sr.title,
            sr.description,
            sr.status,
            sr.notes,
            sr.created_at,
            sr.updated_at,
            v.year,
            v.make,
            v.model,
            c.name AS category_name
        FROM service_requests sr
        LEFT JOIN vehicles v ON v.id = sr.vehicle_id
        LEFT JOIN categories c ON c.id = v.category_id
        WHERE sr.id = $1 AND sr.user_id = $2
        LIMIT 1`,
        [requestId, userId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return mapRowToServiceRequest(row);
};

/**
 * @param {number} requestId
 * @returns {Promise<Array<{
 *  id:number,
 *  status:string,
 *  status_label:string,
 *  note:string|null,
 *  created_at: Date,
 *  actor_user_id: number | null,
 *  actor_name: string | null,
 *  actor_role: string | null
 * }>>}
 */
const listServiceRequestStatusEventsForRequest = async (requestId) => {
    try {
        await ensureStatusEventsTable();
        const result = await db.query(
            `SELECT
                e.id,
                e.status,
                e.note,
                e.created_at,
                u.id AS actor_user_id,
                u.name AS actor_name,
                u.role AS actor_role
            FROM service_request_status_events e
            LEFT JOIN users u ON u.id = e.actor_user_id
            WHERE e.service_request_id = $1
            ORDER BY e.created_at DESC, e.id DESC`,
            [requestId]
        );

        return result.rows.map((row) => ({
            id: row.id,
            status: row.status,
            status_label: toStatusLabel(row.status),
            note: row.note,
            created_at: row.created_at,
            actor_user_id: row.actor_user_id,
            actor_name: row.actor_name,
            actor_role: row.actor_role
        }));
    } catch (error) {
        if (isMissingStatusEventsTableError(error)) {
            const fallback = await db.query(
                `SELECT status, notes, updated_at
                 FROM service_requests
                 WHERE id = $1
                 LIMIT 1`,
                [requestId]
            );

            const row = fallback.rows[0];
            if (!row) return [];

            return [
                {
                    id: 0,
                    status: row.status,
                    status_label: toStatusLabel(row.status),
                    note: row.notes,
                    created_at: row.updated_at,
                    actor_user_id: null,
                    actor_name: null,
                    actor_role: null
                }
            ];
        }

        throw error;
    }
};

/**
 * Creates a service request.
 * If the optional status-events table exists, also records an initial "submitted" event.
 *
 * @param {{ userId: number, title: string, vehicleId: number | null, description: string }}
 * @returns {Promise<{ id: number }>}
 */
const createServiceRequest = async ({ userId, title, vehicleId, description }) => {
    const canWriteStatusEvents = await statusEventsTableExists();
    if (!canWriteStatusEvents) {
        await ensureStatusEventsTable();
    }
    const created = await withTransaction(async (client) => {
        const requestResult = await client.query(
            `INSERT INTO service_requests
                (user_id, vehicle_id, title, description, status, notes)
             VALUES ($1, $2, $3, $4, 'submitted', NULL)
             RETURNING id`,
            [userId, vehicleId, title, description]
        );

        const requestId = requestResult.rows[0].id;
        return { id: requestId };
    });

    if (canWriteStatusEvents) {
        try {
            await db.query(
                `INSERT INTO service_request_status_events
                    (service_request_id, status, note, actor_user_id)
                 VALUES ($1, 'submitted', NULL, $2)`,
                [created.id, userId]
            );
        } catch (error) {
            if (!isMissingStatusEventsTableError(error)) {
                throw error;
            }
        }
    }

    return created;
};

/**
 * Delete a user's service request when it is not completed.
 *
 * @param {{ requestId: number, userId: number }} params
 * @returns {Promise<'cancelled' | 'completed' | 'not_found'>}
 */
const cancelServiceRequestForUser = async ({ requestId, userId }) => {
    const result = await db.query(
        `WITH target AS (
            SELECT status
            FROM service_requests
            WHERE id = $1 AND user_id = $2
        ),
        deleted AS (
            DELETE FROM service_requests
            WHERE id = $1 AND user_id = $2 AND status <> 'completed'
            RETURNING id
        )
        SELECT
            (SELECT status FROM target LIMIT 1) AS existing_status,
            (SELECT id FROM deleted LIMIT 1) AS deleted_id`,
        [requestId, userId]
    );

    const row = result.rows[0];
    if (!row || row.existing_status === null) return 'not_found';
    if (row.deleted_id) return 'cancelled';
    return 'completed';
};

const STAFF_REQUEST_SORT_KEYS = ['default', 'status', 'id', 'name', 'vehicle'];

/**
 * Staff list of service requests with user + vehicle context.
 * Default: open / workflow order first (status stage, then recent activity).
 *
 * @param {{ hideCompleted?: boolean, sortKey?: 'default' | 'status' | 'id' | 'name' | 'vehicle' }} [options]
 */
const listServiceRequestsForStaff = async ({ hideCompleted = false, sortKey = 'default' } = {}) => {
    const safeSort = STAFF_REQUEST_SORT_KEYS.includes(sortKey) ? sortKey : 'default';

    const statusOrderExpr = `CASE sr.status
                WHEN 'submitted' THEN 0
                WHEN 'in_progress' THEN 1
                WHEN 'completed' THEN 2
                ELSE 3 END`;

    const orderByMap = {
        default: `${statusOrderExpr} ASC, sr.updated_at DESC, sr.id DESC`,
        status: `${statusOrderExpr} ASC, sr.updated_at DESC, sr.id DESC`,
        id: 'sr.id DESC',
        name: 'LOWER(u.name) ASC, sr.id DESC',
        vehicle: 'LOWER(v.make) ASC NULLS LAST, LOWER(v.model) ASC NULLS LAST, v.year DESC NULLS LAST, sr.id DESC'
    };

    const orderByClause = orderByMap[safeSort] ?? orderByMap.default;

    const whereClause = hideCompleted ? `WHERE sr.status <> 'completed'` : '';

    const result = await db.query(
        `SELECT
            sr.id,
            sr.user_id,
            sr.vehicle_id,
            sr.title,
            sr.description,
            sr.status,
            sr.notes,
            sr.created_at,
            sr.updated_at,
            v.year,
            v.make,
            v.model,
            c.name AS category_name,
            u.name AS user_name,
            u.email AS user_email,
            ${statusOrderExpr} AS status_sort
        FROM service_requests sr
        INNER JOIN users u ON u.id = sr.user_id
        LEFT JOIN vehicles v ON v.id = sr.vehicle_id
        LEFT JOIN categories c ON c.id = v.category_id
        ${whereClause}
        ORDER BY ${orderByClause}`
    );

    return result.rows.map((row) => ({
        ...mapRowToServiceRequest(row),
        user: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email
        }
    }));
};

const getServiceRequestByIdForStaff = async (requestId) => {
    const result = await db.query(
        `SELECT
            sr.id,
            sr.user_id,
            sr.vehicle_id,
            sr.title,
            sr.description,
            sr.status,
            sr.notes,
            sr.created_at,
            sr.updated_at,
            v.year,
            v.make,
            v.model,
            c.name AS category_name,
            u.name AS user_name,
            u.email AS user_email
        FROM service_requests sr
        INNER JOIN users u ON u.id = sr.user_id
        LEFT JOIN vehicles v ON v.id = sr.vehicle_id
        LEFT JOIN categories c ON c.id = v.category_id
        WHERE sr.id = $1
        LIMIT 1`,
        [requestId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
        ...mapRowToServiceRequest(row),
        user: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email
        }
    };
};

const updateServiceRequestByStaff = async ({ requestId, status, notes, actorUserId }) => {
    await ensureStatusEventsTable();
    const result = await db.query(
        `UPDATE service_requests
         SET status = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id`,
        [requestId, status, notes]
    );

    const row = result.rows[0];
    if (!row) return null;

    const canWriteStatusEvents = await statusEventsTableExists();
    if (canWriteStatusEvents) {
        try {
            await db.query(
                `INSERT INTO service_request_status_events
                    (service_request_id, status, note, actor_user_id)
                 VALUES ($1, $2, $3, $4)`,
                [requestId, status, notes || null, actorUserId]
            );
        } catch (error) {
            if (!isMissingStatusEventsTableError(error)) {
                throw error;
            }
        }
    }

    return row;
};

export {
    SERVICE_REQUEST_STATUSES,
    SERVICE_REQUEST_STATUS_LABELS,
    listServiceRequestsForUser,
    getServiceRequestByIdForUser,
    listServiceRequestStatusEventsForRequest,
    createServiceRequest,
    cancelServiceRequestForUser,
    listServiceRequestsForStaff,
    getServiceRequestByIdForStaff,
    updateServiceRequestByStaff
};
