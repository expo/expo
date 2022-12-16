export type PackageManagerName = 'npm' | 'pnpm' | 'yarn';
/** Determine which package manager to use for installing dependencies based on how the process was started. */
export declare function resolvePackageManager(): PackageManagerName;
export declare function formatRunCommand(manager: PackageManagerName, cmd: string): string;
