import { ExpoConfig } from './Config.types';
/**
 * Should the bundler use .expo file extensions.
 *
 * @param exp
 */
export declare function isLegacyImportsEnabled(exp: Pick<ExpoConfig, 'sdkVersion'>): boolean;
