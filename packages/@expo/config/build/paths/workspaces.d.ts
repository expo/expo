/** Wraps `find-yarn-workspace-root` and guards against having an empty `package.json` file in an upper directory. */
export declare function findWorkspaceRoot(projectRoot: string): string | null;
