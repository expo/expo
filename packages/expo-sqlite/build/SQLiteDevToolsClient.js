import AwaitLock from 'await-lock';
import { startCliListenerAsync } from 'expo/devtools';
import { basename } from './pathUtils';
const DEVTOOLS_PLUGIN_NAME = 'expo-sqlite';
const LIST_TABLES_QUERY = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
let client = null;
const lock = new AwaitLock();
const registeredDatabases = new Map();
export async function registerDatabaseForDevToolsAsync(database) {
    if (!__DEV__) {
        return;
    }
    await maybeInitClientAsync();
    registeredDatabases.set(database.databasePath, new WeakRef(database));
}
export async function unregisterDatabaseForDevToolsAsync(database) {
    if (!__DEV__) {
        return;
    }
    registeredDatabases.delete(database.databasePath);
}
async function maybeInitClientAsync() {
    if (!__DEV__ || client != null) {
        return;
    }
    await lock.acquireAsync();
    try {
        const { getDevToolsPluginClientAsync } = require('expo/devtools');
        client = await getDevToolsPluginClientAsync(DEVTOOLS_PLUGIN_NAME, {
            websocketBinaryType: 'arraybuffer',
        });
        setupDevToolsListeners();
    }
    catch (error) {
        console.warn('Failed to initialize devtools client', error);
    }
    finally {
        lock.release();
    }
}
/**
 * Close the devtools client.
 * Exposed for testing purposes.
 */
export async function closeDevToolsClientAsync() {
    await client?.closeAsync();
    client = null;
    registeredDatabases.clear();
}
function setupDevToolsListeners() {
    client?.addMessageListener('listDatabases', async (params) => {
        try {
            const databases = Array.from(registeredDatabases.keys()).map((databasePath) => ({
                name: basename(databasePath),
                path: databasePath,
            }));
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'listDatabases',
                databases,
            });
        }
        catch (error) {
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'error',
                error: typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error),
                originalMethod: 'listDatabases',
            });
        }
    });
    // getDatabase uses method:requestId channel to support binary data
    client?.addMessageListener('getDatabase', async (params) => {
        const eventName = `getDatabase:${params.requestId}`;
        try {
            const databasePath = Array.from(registeredDatabases.keys()).find((path) => basename(path) === params.database);
            const database = databasePath ? registeredDatabases.get(databasePath)?.deref() : undefined;
            if (!database || !databasePath) {
                throw new Error('Database not found');
            }
            const serialized = await database.serializeAsync();
            client?.sendMessage(eventName, serialized);
        }
        catch (error) {
            client?.sendMessage(eventName, {
                method: 'error',
                error: typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error),
                originalMethod: 'getDatabase',
            });
        }
    });
    client?.addMessageListener('executeQuery', async (params) => {
        try {
            const database = registeredDatabases.get(params.databasePath)?.deref();
            if (!database) {
                client?.sendMessage('response', {
                    requestId: params.requestId,
                    method: 'error',
                    error: 'Database not found',
                    originalMethod: 'executeQuery',
                });
                return;
            }
            const result = await executeQueryAsync(params.query, database);
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'executeQuery',
                result,
            });
        }
        catch (error) {
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'error',
                error: typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error),
                originalMethod: 'executeQuery',
            });
        }
    });
    client?.addMessageListener('listTables', async (params) => {
        try {
            const database = registeredDatabases.get(params.databasePath)?.deref();
            if (!database) {
                client?.sendMessage('response', {
                    requestId: params.requestId,
                    method: 'error',
                    error: 'Database not found',
                    originalMethod: 'listTables',
                });
                return;
            }
            const tables = await getTablesAsync(database);
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'listTables',
                tables: tables.map((t) => t.name),
            });
        }
        catch (error) {
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'error',
                error: typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error),
                originalMethod: 'listTables',
            });
        }
    });
    client?.addMessageListener('getTableSchema', async (params) => {
        try {
            const database = registeredDatabases.get(params.databasePath)?.deref();
            if (!database) {
                client?.sendMessage('response', {
                    requestId: params.requestId,
                    method: 'error',
                    error: 'Database not found',
                    originalMethod: 'getTableSchema',
                });
                return;
            }
            const schema = await fetchTableSchemaAsync(params.tableName, database);
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'getTableSchema',
                schema,
            });
        }
        catch (error) {
            client?.sendMessage('response', {
                requestId: params.requestId,
                method: 'error',
                error: typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error),
                originalMethod: 'getTableSchema',
            });
        }
    });
}
/* Setup listeners for the cli extensions client. */
const EXTENSION_NAME = 'expo-sqlite-cli-extension';
startCliListenerAsync(EXTENSION_NAME).then(({ addMessageListener }) => {
    addMessageListener('listDatabases', async ({ sendResponseAsync }) => {
        try {
            if (registeredDatabases.size === 0) {
                return sendResponseAsync('No databases registered.');
            }
            await sendResponseAsync('Databases: ' +
                Array.from(registeredDatabases.keys())
                    .map((databasePath) => basename(databasePath))
                    .join(', '));
        }
        catch (error) {
            await sendResponseAsync('An error occurred while listing databases: ' +
                (typeof error === 'object' && error !== null && 'message' in error
                    ? (String(error.message) ?? 'Unknown error')
                    : String(error)));
        }
    });
    addMessageListener('executeQuery', async ({ sendResponseAsync, params }) => {
        try {
            const database = findDatabase(params.name);
            if (!database) {
                return sendResponseAsync(`Database ${params.name} not found`);
            }
            const result = await executeQueryAsync(params.query, database);
            await sendResponseAsync(`\n\n${tableFormatHelper(result)}`);
        }
        catch (error) {
            await sendResponseAsync('An error occurred while executing the query: ' +
                (typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error)));
        }
    });
    addMessageListener('listTables', async ({ sendResponseAsync, params }) => {
        try {
            const database = findDatabase(params.name);
            if (!database) {
                return sendResponseAsync(`Database ${params.name} not found`);
            }
            const tables = await getTablesAsync(database);
            await sendResponseAsync(`Tables in ${basename(database.databasePath)}: ` + tables.map((t) => t.name).join(', '));
        }
        catch (error) {
            await sendResponseAsync('An error occurred while listing tables: ' +
                (typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error)));
        }
    });
    addMessageListener('getTableSchema', async ({ sendResponseAsync, params }) => {
        try {
            const database = findDatabase(params.name);
            if (!database) {
                return sendResponseAsync(`Database ${params.name} not found`);
            }
            const schema = await fetchTableSchemaAsync(params.table, database);
            await sendResponseAsync(`\n\n${schemaFormatHelper(schema)}`);
        }
        catch (error) {
            await sendResponseAsync('An error occurred while retrieving the table schema: ' +
                (typeof error === 'object' && error !== null && 'message' in error
                    ? error.message
                    : String(error)));
        }
    });
});
async function getTablesAsync(database) {
    return (await database.getAllAsync(LIST_TABLES_QUERY));
}
async function fetchTableSchemaAsync(table, database) {
    const tables = (await database.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [table]));
    if (tables.length === 0) {
        throw new Error(`Table '${table}' not found`);
    }
    const schema = (await database.getAllAsync(`PRAGMA table_info(${table})`));
    return schema;
}
async function executeQueryAsync(query, database) {
    const trimmedQuery = query.trim().toUpperCase();
    const isReadQuery = trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('PRAGMA');
    let result;
    if (isReadQuery) {
        const rows = await database.getAllAsync(query, []);
        const columns = rows.length > 0 && rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]) : [];
        result = { rows, columns };
    }
    else {
        const runResult = await database.runAsync(query, []);
        result = {
            rows: [],
            columns: [],
            changes: runResult.changes,
            lastInsertRowId: runResult.lastInsertRowId,
        };
    }
    return result;
}
function findDatabase(name) {
    return Array.from(registeredDatabases.values())
        .find((ref) => {
        const db = ref.deref();
        return db?.databasePath.endsWith(name) || db?.databasePath.endsWith(name + '.db');
    })
        ?.deref();
}
/**
 * Formats the query result into a table-like string for better readability in the CLI.
 * Example output:
 * id | title | done
 * ---|-------|-----
 * 4  | Milk  | 0
 * 5  | Cake  | 0
 *
 * For a query like: SELECT id, title, done FROM todos;
 * Output: { "rows": [ { "id": 4, "title": "Milk", "done": 0},{"id": 5,"title": "Cake", "done": 0}],"columns": ["id","title","done"}
 */
function tableFormatHelper(results) {
    const columnWidths = results.columns.map((col) => col.length);
    results.rows.forEach((row) => {
        results.columns.forEach((col, index) => {
            const cellLength = String(row[col]).length;
            if (cellLength > columnWidths[index]) {
                columnWidths[index] = cellLength;
            }
        });
    });
    const header = results.columns.map((col, index) => col.padEnd(columnWidths[index])).join(' | ');
    const separator = columnWidths.map((width) => '-'.repeat(width)).join('-|-');
    const rows = results.rows.map((row) => results.columns.map((col, index) => String(row[col]).padEnd(columnWidths[index])).join(' | '));
    return [header, separator, ...rows].join('\n');
}
/**
 * [ {"cid": 0, "name": "id","type": "INTEGER","notnull": 0,"dflt_value": null, "pk": 1},{"cid": 1,name": "title",type": "TEXT",null": 1,alue": null, "pk": 0}]
 * @param schema
 * @returns
 */
function schemaFormatHelper(schema) {
    const columnWidths = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'].map((col) => Math.max(col.length, ...schema.map((row) => String(row[col]).length)));
    const header = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk']
        .map((col, index) => col.padEnd(columnWidths[index]))
        .join(' | ');
    const separator = columnWidths.map((width) => '-'.repeat(width)).join('-|-');
    const rows = schema.map((row) => ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk']
        .map((col, index) => String(row[col]).padEnd(columnWidths[index]))
        .join(' | '));
    return [header, separator, ...rows].join('\n');
}
//# sourceMappingURL=SQLiteDevToolsClient.js.map