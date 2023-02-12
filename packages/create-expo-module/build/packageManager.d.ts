import { PackageManagerName } from './resolvePackageManager';
export declare function installDependencies(packageManager: PackageManagerName, appPath: string, ...args: string[]): Promise<void>;
