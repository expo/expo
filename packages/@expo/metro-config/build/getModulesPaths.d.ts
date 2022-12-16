/** Wraps `findWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
export declare function getWorkspaceRoot(projectRoot: string): string | null;
export declare function getModulesPaths(projectRoot: string): string[];
