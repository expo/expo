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
 * Get the module name that should be handled as sticky import.
 */
function getStickyModuleName(moduleImport: string) {
  if (moduleImport === 'react-native' || moduleImport.startsWith('react-native/')) {
    return 'react-native';
  }

  if (
    moduleImport === '@react-native/assets-registry' ||
    moduleImport.startsWith('@react-native/assets-registry/')
  ) {
    return '@react-native/assets-registry';
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
    if (moduleRoot[moduleName] && moduleRoot[moduleName]) {
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
    // Check if the module import refers to a module that should be handled as sticky, and return the name
    const moduleName = getStickyModuleName(moduleImport);
    // Abort if the module is not a sticky module, or no platform was defined
    if (!platform || !moduleName) {
      return null;
    }

    // Resolve from the sticky modules cache directly
    if (moduleRoot[moduleName]) {
      return getStrictResolver(
        context,
        platform
      )(moduleImport.replace(moduleName, moduleRoot[moduleName]));
    }

    // Create the resolver, used to finalize the resolution
    const resolve = getStrictResolver(context, platform);

    // Resolve `@react-native/assets-registry` from `react-native`
    if (moduleName === '@react-native/assets-registry') {
      const reactNativeRoot = resolveStickyRoot(resolve, 'react-native', platform);
      // Attempt to seed the sticky module root for `@react-native/assets-registry`, from `react-native`
      if (reactNativeRoot) {
        resolveStickyRoot(
          getStrictResolver(createRelativeContext(context, reactNativeRoot), platform),
          moduleName,
          platform
        );
      }
    }

    // Try to resolve the sticky module root
    const stickyModulePath = resolveStickyRoot(resolve, moduleName, platform);
    if (!stickyModulePath) return null;

    // Return the finalized sticky resolution
    return resolve(moduleImport.replace(moduleName, stickyModulePath));
  };
}

/**
 * Return a new resolution context where the resolution is relative to the given directory.
 * Note that the `moduleRoot` is already a directory, that's why we need to add `/.` for Expo's fast resolver.
 */
function createRelativeContext<T extends ResolutionContext>(context: T, moduleRoot: string): T {
  return { ...context, originModulePath: `${moduleRoot}/package.json` };
}
