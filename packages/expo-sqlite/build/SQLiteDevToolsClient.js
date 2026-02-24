import AwaitLock from 'await-lock';
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
                error: errorMessage(error),
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
                error: errorMessage(error),
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
            const trimmedQuery = params.query.trim().toUpperCase();
            const isReadQuery = trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('PRAGMA');
            let result;
            if (isReadQuery) {
                const rows = await database.getAllAsync(params.query, params.params || []);
                const columns = rows.length > 0 && rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]) : [];
                result = { rows, columns };
            }
            else {
                const runResult = await database.runAsync(params.query, params.params || []);
                result = {
                    rows: [],
                    columns: [],
                    changes: runResult.changes,
                    lastInsertRowId: runResult.lastInsertRowId,
                };
            }
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
                error: errorMessage(error),
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
            const tables = (await database.getAllAsync(LIST_TABLES_QUERY));
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
                error: errorMessage(error),
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
            const tables = (await database.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [params.tableName]));
            if (tables.length === 0) {
                throw new Error(`Table '${params.tableName}' not found`);
            }
            const schema = (await database.getAllAsync(`PRAGMA table_info(${params.tableName})`));
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
                error: errorMessage(error),
                originalMethod: 'getTableSchema',
            });
        }
    });
}
/* Setup listeners for the cli extensions client. */
const EXTENSION_NAME = 'expo-sqlite-cli-extension';
// Lazy-require @expo/devtools to avoid forcing full module initialization in environments
// where native modules aren't available (e.g. Jest). startCliListenerAsync is only exported
// from the Node.js (CJS) entry point of @expo/devtools.
if (__DEV__) {
    const { startCliListenerAsync } = require('@expo/devtools');
    if (typeof startCliListenerAsync === 'function') {
        startCliListenerAsync(EXTENSION_NAME)
            .then(({ addMessageListener }) => {
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
                    await sendResponseAsync('An error occurred while listing databases: ' + errorMessage(error));
                }
            });
            addMessageListener('executeQuery', async ({ sendResponseAsync, params }) => {
                try {
                    const database = findDatabase(params.name);
                    if (!database) {
                        return sendResponseAsync(`Database ${params.name} not found`);
                    }
                    const result = await executeQueryAsync(params.query, database);
                    await sendResponseAsync(`\n\n${formatTable(result.columns, result.rows)}`);
                }
                catch (error) {
                    await sendResponseAsync('An error occurred while executing the query: ' + errorMessage(error));
                }
            });
            addMessageListener('listTables', async ({ sendResponseAsync, params }) => {
                try {
                    const database = findDatabase(params.name);
                    if (!database) {
                        return sendResponseAsync(`Database ${params.name} not found`);
                    }
                    const tables = await getTablesAsync(database);
                    await sendResponseAsync(`Tables in ${basename(database.databasePath)}: ` +
                        tables.map((t) => t.name).join(', '));
                }
                catch (error) {
                    await sendResponseAsync('An error occurred while listing tables: ' + errorMessage(error));
                }
            });
            addMessageListener('getTableSchema', async ({ sendResponseAsync, params }) => {
                try {
                    const database = findDatabase(params.name);
                    if (!database) {
                        return sendResponseAsync(`Database ${params.name} not found`);
                    }
                    const schema = await fetchTableSchemaAsync(params.table, database);
                    await sendResponseAsync(`\n\n${formatTable(['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'], schema)}`);
                }
                catch (error) {
                    await sendResponseAsync('An error occurred while retrieving the table schema: ' + errorMessage(error));
                }
            });
        })
            .catch(() => {
            // Silently ignore connection failures (e.g. no dev server in test environments)
        });
    }
}
function errorMessage(error) {
    return typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : String(error);
}
async function getTablesAsync(database) {
    return (await database.getAllAsync(LIST_TABLES_QUERY));
}
async function fetchTableSchemaAsync(table, database) {
    const tables = (await database.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [table]));
    if (tables.length === 0) {
        throw new Error(`Table '${table}' not found`);
    }
    return (await database.getAllAsync(`PRAGMA table_info(${table})`));
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
    for (const [path, ref] of registeredDatabases) {
        if (basename(path) === name || basename(path) === name + '.db') {
            return ref.deref();
        }
    }
    return undefined;
}
function formatTable(columns, rows) {
    const widths = columns.map((col) => Math.max(col.length, ...rows.map((row) => String(row[col]).length)));
    const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
    const separator = widths.map((w) => '-'.repeat(w)).join('-|-');
    const body = rows.map((row) => columns.map((col, i) => String(row[col]).padEnd(widths[i])).join(' | '));
    return [header, separator, ...body].join('\n');
}
//# sourceMappingURL=SQLiteDevToolsClient.js.map