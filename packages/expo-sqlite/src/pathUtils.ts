import ExpoSQLite from './ExpoSQLite';

/**
 * Resolves the database directory from the given directory or the default directory.
 *
 * @hidden
 */
function resolveDbDirectory(directory: string | undefined): string {
  const resolvedDirectory = directory ?? ExpoSQLite.defaultDatabaseDirectory;
  if (resolvedDirectory === null) {
    throw new Error('Both provided directory and defaultDatabaseDirectory are null.');
  }
  return resolvedDirectory;
}

/**
 * Creates a normalized database path by combining the directory and database name.
 *
 * Ensures the directory does not end with a trailing slash and the database name
 * does not start with a leading slash, preventing redundant slashes in the final path.
 *
 * @hidden
 */
export function createDatabasePath(databaseName: string, directory?: string): string {
  if (databaseName === ':memory:') return databaseName;
  const resolvedDirectory = resolveDbDirectory(directory);

  function removeTrailingSlash(path: string): string {
    return path.replace(/\/*$/, '');
  }
  function removeLeadingSlash(path: string): string {
    return path.replace(/^\/+/, '');
  }

  return `${removeTrailingSlash(resolvedDirectory)}/${removeLeadingSlash(databaseName)}`;
}
