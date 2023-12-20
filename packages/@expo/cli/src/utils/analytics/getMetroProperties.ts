import { ExpoConfig } from '@expo/config';

/**
 * Get the unstable / experimental properties used within the Metro config.
 * Note that this should match `metro-config`, but uses newer features that are not yet typed.
 *
 * @see https://github.com/facebook/metro/blob/1d51ffd33f54dba25c54b49ff059543dac519f21/packages/metro-config/src/configTypes.flow.js
 */
export function getMetroProperties(
  projectRoot: string,
  exp: ExpoConfig,
  metroConfig: Record<string, any> = {}
) {
  return {
    sdkVersion: exp.sdkVersion,
    metroVersion: require('metro/package.json').version,

    fileMapCacheManagerFactory:
      Boolean(metroConfig.unstable_fileMapCacheManagerFactory) || undefined, // CacheManagerFactory
    perfLogger: Boolean(metroConfig.unstable_perfLogger) || undefined, // PerfLoggerFactory

    resolverEnableSymlinks: metroConfig.resolver?.unstable_enableSymlinks, // boolean
    resolverConditionNames: metroConfig.resolver?.unstable_conditionNames, // string[]
    resolverConditionsByPlatform: metroConfig.resolver?.unstable_conditionsByPlatform, // { [platform: string]: string[] }
    resolverEnablePackageExports: metroConfig.resolver?.unstable_enablePackageExports, // boolean

    serverImportBundleSupport: metroConfig.server?.experimentalImportBundleSupport, // boolean
    serverServerRoot: Boolean(metroConfig.server?.unstable_serverRoot) || undefined, // string | null

    transformerCollectDependenciesPath: metroConfig.transformer?.unstable_collectDependenciesPath, // string
    transformerDependencyMapReservedName:
      metroConfig.transformer?.unstable_dependencyMapReservedName, // string | null
    transformerDisableModuleWrapping: metroConfig.transformer?.unstable_disableModuleWrapping, // boolean
    transformerDisableNormalizePseudoGlobals:
      metroConfig.transformer?.unstable_disableNormalizePseudoGlobals, // boolean
    transformerCompactOutput: metroConfig.transformer?.unstable_compactOutput, // boolean
    transformerAllowRequireContext: metroConfig.transformer?.unstable_allowRequireContext, // boolean
  };
}
