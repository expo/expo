import type { ModuleDescriptor, SupportedPlatform } from '../types';
interface GenerateModulesProviderParams {
    platform: SupportedPlatform;
    targetPath: string;
    targetName?: string;
    entitlementPath: string | null;
    watchedDirectories: string[];
    inlineModulesTargets: {
        mainTarget?: string;
        targets: string[];
    };
    appRoot: string;
}
/** Generates ExpoModulesProvider file listing all packages to link (Apple-only)
 */
export declare function generateModulesProviderAsync(modules: ModuleDescriptor[], params: GenerateModulesProviderParams): Promise<void>;
export {};
