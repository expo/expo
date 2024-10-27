import { SupportedPlatform } from '../types';
export declare function getLinkingImplementationForPlatform(platform: SupportedPlatform): any;
/**
 * Get the possible path to the pnpm isolated modules folder.
 */
export declare function getIsolatedModulesPath(packagePath: string, packageName: string): string | null;
