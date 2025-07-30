import spawnAsync from '@expo/spawn-async';
import { PackageManagerName } from './resolvePackageManager';
export declare function installDependencies(packageManager: PackageManagerName, appPath: string, ...args: string[]): Promise<spawnAsync.SpawnResult>;
