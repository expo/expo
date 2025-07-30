import { PackageManagerName } from './resolvePackageManager';
import { SubstitutionData } from './types';
/**
 * Initializes a new Expo project as an example app.
 */
export declare function createExampleApp(data: SubstitutionData, targetDir: string, packageManager: PackageManagerName): Promise<void>;
