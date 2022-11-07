import { AppJSONConfig, ConfigFilePaths, ExpoConfig, GetConfigOptions, PackageJSONConfig, ProjectConfig, ProjectTarget, WriteConfigOptions } from './Config.types';
/**
 * Evaluate the config for an Expo project.
 * If a function is exported from the `app.config.js` then a partial config will be passed as an argument.
 * The partial config is composed from any existing app.json, and certain fields from the `package.json` like name and description.
 *
 * If options.isPublicConfig is true, the Expo config will include only public-facing options (omitting private keys).
 * The resulting config should be suitable for hosting or embedding in a publicly readable location.
 *
 * **Example**
 * ```js
 * module.exports = function({ config }) {
 *   // mutate the config before returning it.
 *   config.slug = 'new slug'
 *   return { expo: config };
 * }
 * ```
 *
 * **Supports**
 * - `app.config.ts`
 * - `app.config.js`
 * - `app.config.json`
 * - `app.json`
 *
 * @param projectRoot the root folder containing all of your application code
 * @param options enforce criteria for a project config
 */
export declare function getConfig(projectRoot: string, options?: GetConfigOptions): ProjectConfig;
export declare function getPackageJson(projectRoot: string): PackageJSONConfig;
/**
 * Get the static and dynamic config paths for a project. Also accounts for custom paths.
 *
 * @param projectRoot
 */
export declare function getConfigFilePaths(projectRoot: string): ConfigFilePaths;
/**
 * Attempt to modify an Expo project config.
 * This will only fully work if the project is using static configs only.
 * Otherwise 'warn' | 'fail' will return with a message about why the config couldn't be updated.
 * The potentially modified config object will be returned for testing purposes.
 *
 * @param projectRoot
 * @param modifications modifications to make to an existing config
 * @param readOptions options for reading the current config file
 * @param writeOptions If true, the static config file will not be rewritten
 */
export declare function modifyConfigAsync(projectRoot: string, modifications: Partial<ExpoConfig>, readOptions?: GetConfigOptions, writeOptions?: WriteConfigOptions): Promise<{
    type: 'success' | 'warn' | 'fail';
    message?: string;
    config: AppJSONConfig | null;
}>;
export declare function getWebOutputPath(config?: {
    [key: string]: any;
}): string;
export declare function getNameFromConfig(exp?: Record<string, any>): {
    appName?: string;
    webName?: string;
};
export declare function getDefaultTarget(projectRoot: string, exp?: Pick<ExpoConfig, 'sdkVersion'>): ProjectTarget;
/**
 * Return a useful name describing the project config.
 * - dynamic: app.config.js
 * - static: app.json
 * - custom path app config relative to root folder
 * - both: app.config.js or app.json
 */
export declare function getProjectConfigDescription(projectRoot: string): string;
/**
 * Returns a string describing the configurations used for the given project root.
 * Will return null if no config is found.
 *
 * @param projectRoot
 * @param projectConfig
 */
export declare function getProjectConfigDescriptionWithPaths(projectRoot: string, projectConfig: ConfigFilePaths): string;
export * from './Config.types';
