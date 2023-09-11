export declare const NPM_LOCK_FILE = "package-lock.json";
export declare const YARN_LOCK_FILE = "yarn.lock";
export declare const PNPM_LOCK_FILE = "pnpm-lock.yaml";
export declare const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
export declare const BUN_LOCK_FILE = "bun.lockb";
/** Wraps `find-yarn-workspace-root` and guards against having an empty `package.json` file in an upper directory. */
export declare function findYarnOrNpmWorkspaceRoot(projectRoot: string): string | null;
/**
 * Find the `pnpm-workspace.yaml` file that represents the root of the monorepo.
 * This is a synchronous function based on the original async library.
 * @see https://github.com/pnpm/pnpm/blob/main/packages/find-workspace-dir/src/index.ts
 */
export declare function findPnpmWorkspaceRoot(projectRoot: string): string | null;
