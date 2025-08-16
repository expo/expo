import { ModuleDescriptor, SupportedPlatform } from '../types';
interface GeneratePackageListParams {
    platform: SupportedPlatform;
    targetPath: string;
    namespace: string;
}
/** Generates a source file listing all packages to link (Android-only) */
export declare function generatePackageListAsync(modules: ModuleDescriptor[], params: GeneratePackageListParams): Promise<void>;
interface GenerateModulesProviderParams {
    platform: SupportedPlatform;
    targetPath: string;
    entitlementPath: string | null;
}
/** Generates ExpoModulesProvider file listing all packages to link (Apple-only)
 */
export declare function generateModulesProviderAsync(modules: ModuleDescriptor[], params: GenerateModulesProviderParams): Promise<void>;
export {};
