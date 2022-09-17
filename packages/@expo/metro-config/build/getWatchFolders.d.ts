/**
 * @param workspaceProjectRoot Root file path for the yarn workspace
 * @param linkedPackages List of folders that contain linked node modules, ex: `['packages/*', 'apps/*']`
 * @returns List of valid package.json file paths, ex: `['/Users/me/app/apps/my-app/package.json', '/Users/me/app/packages/my-package/package.json']`
 */
export declare function globAllPackageJsonPaths(workspaceProjectRoot: string, linkedPackages: string[]): string[];
/**
 * @param workspaceProjectRoot root file path for a yarn workspace.
 * @returns list of package.json file paths that are linked to the yarn workspace.
 */
export declare function resolveAllWorkspacePackageJsonPaths(workspaceProjectRoot: string): string[];
/**
 * @param projectRoot file path to app's project root
 * @returns list of node module paths to watch in Metro bundler, ex: `['/Users/me/app/node_modules/', '/Users/me/app/apps/my-app/', '/Users/me/app/packages/my-package/']`
 */
export declare function getWatchFolders(projectRoot: string): string[];
