import { GenerateModulesProviderOptions, GenerateOptions, ModuleDescriptor } from '../types';
/**
 * Generates a source file listing all packages to link.
 * Right know it works only for Android platform.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptor[], options: GenerateOptions): Promise<void>;
/**
 * Generates ExpoModulesProvider file listing all packages to link.
 * Right know it works only for Apple platforms.
 */
export declare function generateModulesProviderAsync(modules: ModuleDescriptor[], options: GenerateModulesProviderOptions): Promise<void>;
