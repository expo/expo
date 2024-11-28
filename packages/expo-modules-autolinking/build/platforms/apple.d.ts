import type { ExtraDependencies, ModuleDescriptorIos, ModuleIosPodspecInfo, PackageRevision, SearchOptions } from '../types';
export declare function getSwiftModuleNames(pods: ModuleIosPodspecInfo[], swiftModuleNames: string[] | undefined): string[];
/**
 * Resolves module search result with additional details required for iOS platform.
 */
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision, options: SearchOptions): Promise<ModuleDescriptorIos | null>;
export declare function resolveExtraBuildDependenciesAsync(projectNativeRoot: string): Promise<ExtraDependencies | null>;
/**
 * Generates Swift file that contains all autolinked Swift packages.
 */
export declare function generateModulesProviderAsync(modules: ModuleDescriptorIos[], targetPath: string, entitlementPath: string): Promise<void>;
/**
 * Formats an array of modules to Swift's array containing ReactDelegateHandlers
 */
export declare function formatArrayOfReactDelegateHandler(modules: ModuleDescriptorIos[]): string;
