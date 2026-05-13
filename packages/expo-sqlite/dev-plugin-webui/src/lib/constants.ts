export const DEVTOOLS_PLUGIN_NAME = 'expo-sqlite';
export const REQUEST_TIMEOUT_MS = 30000;

export const SQL_QUERIES = {
  LIST_TABLES:
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  TABLE_INFO: (tableName: string) => `PRAGMA table_info(${tableName})`,
} as const;
