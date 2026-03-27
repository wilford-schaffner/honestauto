import db, { withTransaction } from './db.js';

const SERVICE_REQUEST_STATUSES = ['submitted', 'in_progress', 'completed'];

const SERVICE_REQUEST_STATUS_LABELS = {
    submitted: 'Submitted',
    in_progress: 'In Progress',
    completed: 'Completed'
};

const toStatusLabel = (status) => SERVICE_REQUEST_STATUS_LABELS[status] ?? status;
const STATUS_EVENTS_TABLE = 'service_request_status_events';
const SERVICE_REQUESTS_TABLE = 'service_requests';
const SERVICE_REQUEST_TITLE_COLUMN = 'title';

const isMissingStatusEventsTableError = (error) =>
    error?.code === '42P01' && String(error?.message || '').includes(STATUS_EVENTS_TABLE);

const statusEventsTableExists = async () => {
    const result = await db.query(`SELECT to_regclass('public.${STATUS_EVENTS_TABLE}') AS relation_name`);
    return Boolean(result.rows[0]?.relation_name);
};

const serviceRequestTitleColumnExists = async () => {
    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = $1
              AND column_name = $2
        ) AS has_column`,
        [SERVICE_REQUESTS_TABLE, SERVICE_REQUEST_TITLE_COLUMN]
    );

    return Boolean(result.rows[0]?.has_column);
};

const coerceText = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return String(value);
};

/**
 * Parses optional "Title: …" prefix stored in the description column (backup of
 * the title, and used when no dedicated title column exists).
 *
 * @returns {{ isPrefixed: boolean, title: string, description: string }}
 */
const parseLegacyDescription = (raw) => {
    const full = coerceText(raw)
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    const marker = 'Title: ';
    if (!full.startsWith(marker)) {
        return { isPrefixed: false, title: '', description: full };
    }

    const rest = full.slice(marker.length);
    let title = '';
    let body = '';

    const doubleNewline = rest.indexOf('\n\n');
    if (doubleNewline >= 0) {
        title = rest.slice(0, doubleNewline).trim();
        body = rest.slice(doubleNewline + 2).trim();
    } else {
        const singleNewline = rest.indexOf('\n');
        if (singleNewline >= 0) {
            title = rest.slice(0, singleNewline).trim();
            body = rest.slice(singleNewline + 1).trim();
        } else {
            title = rest.trim();
        }
    }

    return { isPrefixed: true, title, description: body };
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

    const sqlTitle = coerceText(row.title).trim();
    const parsed = parseLegacyDescription(row.description);

    const displayTitle = sqlTitle || parsed.title;

    return {
        id: row.id,
        status: row.status,
        status_label: toStatusLabel(row.status),
        title: displayTitle,
        description: parsed.description,
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
 *   description: string,
 *   notes: string | null,
 *   created_at: Date,
 *   updated_at: Date,
 *   vehicle_id: number | null,
 *   vehicle: { id: number, year: number, make: string, model: string, category_name: string } | null
 * }>>}
 */
const listServiceRequestsForUser = async (userId) => {
    const hasTitleColumn = await serviceRequestTitleColumnExists();
    const titleSelection = hasTitleColumn ? 'sr.title' : 'NULL::text AS title';
    const result = await db.query(
        `SELECT
            sr.id,
            sr.user_id,
            sr.vehicle_id,
            ${titleSelection},
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
 *  description:string,
 *  notes:string|null,
 *  created_at:Date,
 *  updated_at:Date,
 *  vehicle_id:number|null,
 *  vehicle: { id:number, year:number, make:string, model:string, category_name:string } | null
 * } | null>}
 */
const getServiceRequestByIdForUser = async ({ requestId, userId }) => {
    const hasTitleColumn = await serviceRequestTitleColumnExists();
    const titleSelection = hasTitleColumn ? 'sr.title' : 'NULL::text AS title';
    const result = await db.query(
        `SELECT
            sr.id,
            sr.user_id,
            sr.vehicle_id,
            ${titleSelection},
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
            ORDER BY e.created_at ASC, e.id ASC`,
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
            return [];
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
    const hasTitleColumn = await serviceRequestTitleColumnExists();

    const created = await withTransaction(async (client) => {
        const storedDescription = `Title: ${title}\n\n${description}`;
        const insertColumns = hasTitleColumn
            ? '(user_id, vehicle_id, title, description, status, notes)'
            : '(user_id, vehicle_id, description, status, notes)';
        const insertValues = hasTitleColumn
            ? '($1, $2, $3, $4, \'submitted\', NULL)'
            : '($1, $2, $3, \'submitted\', NULL)';
        const insertParams = hasTitleColumn
            ? [userId, vehicleId, title, storedDescription]
            : [userId, vehicleId, storedDescription];

        const requestResult = await client.query(
            `INSERT INTO service_requests ${insertColumns}
             VALUES ${insertValues}
             RETURNING id`,
            insertParams
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

export {
    SERVICE_REQUEST_STATUSES,
    SERVICE_REQUEST_STATUS_LABELS,
    listServiceRequestsForUser,
    getServiceRequestByIdForUser,
    listServiceRequestStatusEventsForRequest,
    createServiceRequest,
    cancelServiceRequestForUser
};
