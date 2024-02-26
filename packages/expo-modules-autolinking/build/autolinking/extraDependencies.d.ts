import type { ExtraDependencies } from '../types';
/**
 * Gets the `expo-build-properties` settings from the app config.
 */
export declare function getBuildPropertiesAsync(projectRoot: string): Promise<Record<string, any>>;
/**
 * Resolves the extra dependencies from `expo-build-properties` settings.
 */
export declare function resolveExtraDependenciesAsync(projectRoot: string): Promise<Partial<ExtraDependencies>>;
