import { type ResolutionResult } from './types';
import { RNConfigReactNativeProjectConfig } from '../reactNativeConfig';
interface ResolutionOptions {
    shouldIncludeDependency?(name: string): boolean;
}
export declare function scanDependenciesFromRNProjectConfig(rawPath: string, projectConfig: RNConfigReactNativeProjectConfig | null, { shouldIncludeDependency }?: ResolutionOptions): Promise<ResolutionResult>;
export {};
