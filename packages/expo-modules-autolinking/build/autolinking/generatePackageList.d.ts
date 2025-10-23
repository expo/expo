import { ModuleDescriptor, SupportedPlatform } from '../types';
interface GenerateModulesProviderParams {
    platform: SupportedPlatform;
    targetPath: string;
    entitlementPath: string | null;
}
/** Generates ExpoModulesProvider file listing all packages to link (Apple-only)
 */
export declare function generateModulesProviderAsync(modules: ModuleDescriptor[], params: GenerateModulesProviderParams): Promise<void>;
export {};
