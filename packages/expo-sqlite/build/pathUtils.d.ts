/**
 * Creates a normalized database path by combining the directory and database name.
 *
 * Ensures the directory does not end with a trailing slash and the database name
 * does not start with a leading slash, preventing redundant slashes in the final path.
 *
 * @hidden
 */
export declare function createDatabasePath(databaseName: string, directory?: string): string;
//# sourceMappingURL=pathUtils.d.ts.map