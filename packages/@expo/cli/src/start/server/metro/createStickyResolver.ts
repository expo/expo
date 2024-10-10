import type { Resolution, ResolutionContext } from 'metro-resolver';
import path from 'node:path';

import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:sticky-resolver') as typeof console.log;

type StrictResolver = (moduleName: string) => Resolution;
type StrictResolverFactory = (
  context: ResolutionContext,
  platform: string | null
) => StrictResolver;

/**
 * Check if and get the sticky module information from the user-provided module import path.
 * The returned `name` is the module name where the root path is resolved,
 * and the `path` is the relative module import path.
 */
function getStickyModule(
  context: ResolutionContext,
  moduleImport: string,
  platform: string | null
) {
  if (moduleImport === 'react-native' || moduleImport.startsWith('react-native/')) {
    return { name: 'react-native', path: moduleImport.replace('react-native', '') };
  }

  if (
    moduleImport === '@react-native/assets-registry' ||
    moduleImport.startsWith('@react-native/assets-registry/')
  ) {
    return {
      name: '@react-native/assets-registry',
      path: moduleImport.replace('@react-native/assets-registry', ''),
    };
  }

  if (
    platform === 'web' &&
    moduleImport.endsWith('/modules/AssetRegistry') &&
    (moduleImport.startsWith('react-native-web/') || // If `react-native-web`'s asset registry is imported directly
      /node_modules[\\/]react-native-web[\\/]/.test(context.originModulePath)) // If `react-native-web`'s asset registry is imported internally
  ) {
    return {
      name: '@react-native/assets-registry',
      path: '/registry',
    };
  }

  return null;
}

/**
 * The sticky resolver is a resolver that resolves the root location of a module, and use that path for all subsequent resolutions.
 * It should be primarily used to "deduplicate" packages that are vulnerable to multiple versions being resolved or bundled:
 *   - `react-native` - When multiple versions are resolved, the app breaks in unexpected ways without clear errors
 *   - `@react-native/assets-registry` - Installed by `react-native`, this package is stateful - only a single one can exist in the bundle
 *
 * @remarks This does NOT follow Node module resolution, and should be used with caution.
 */
export function createStickyResolver(
  getStrictResolver: StrictResolverFactory
): ExpoCustomMetroResolver {
  // The root of all sticky modules
  const moduleRoot: Record<string, string> = {};

  const resolveStickyRoot = (
    resolve: StrictResolver,
    moduleName: string,
    platform: string
  ): null | string => {
    // Resolve from the sticky modules cache
    if (moduleRoot[moduleName]) {
      return moduleRoot[moduleName];
    }

    // Resolve the root module path through `<moduleName>/package.json`
    const result = resolve(`${moduleName}/package.json`);
    // Abort when the module is not a source file
    if (result.type !== 'sourceFile') {
      return null;
    }

    // Cache the resolved module path
    moduleRoot[moduleName] = path.dirname(result.filePath);

    debug(`Sticky resolution for ${platform}: ${moduleName} -> ${moduleRoot[moduleName]}`);

    return moduleRoot[moduleName];
  };

  return (context, moduleImport, platform) => {
    if (!platform) {
      return null;
    }

    // Check if the module import refers to a module that should be handled as sticky, and return the name
    const stickyModule = getStickyModule(context, moduleImport, platform);
    // Abort if the module is not a sticky module, or no platform was defined
    if (!stickyModule) {
      return null;
    }

    // Resolve from the sticky modules cache directly
    if (moduleRoot[stickyModule.name]) {
      return getStrictResolver(
        context,
        platform
      )(moduleRoot[stickyModule.name] + stickyModule.path);
    }

    // Create the resolver, used to finalize the resolution
    const resolve = getStrictResolver(context, platform);

    // Resolve `@react-native/assets-registry` from `react-native`
    if (stickyModule.name === '@react-native/assets-registry') {
      const reactNativeRoot = resolveStickyRoot(resolve, 'react-native', platform);
      // Attempt to seed the sticky module root for `@react-native/assets-registry`, from `react-native`
      if (reactNativeRoot) {
        resolveStickyRoot(
          getStrictResolver(createRelativeContext(context, reactNativeRoot), platform),
          stickyModule.name,
          platform
        );
      }
    }

    // Try to resolve the sticky module root
    const stickyModulePath = resolveStickyRoot(resolve, stickyModule.name, platform);
    if (!stickyModulePath) {
      return null;
    }

    // Return the finalized sticky resolution
    return getStrictResolver(context, platform)(moduleRoot[stickyModule.name] + stickyModule.path);
  };
}

/**
 * Return a new resolution context where the resolution is relative to the given directory.
 * Note that the `moduleRoot` is already a directory, that's why we need to add `/.` for Expo's fast resolver.
 */
function createRelativeContext<T extends ResolutionContext>(context: T, moduleRoot: string): T {
  return { ...context, originModulePath: `${moduleRoot}/package.json` };
}
