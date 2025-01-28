// This file creates the fallback resolver
// The fallback resolver applies only to module imports and should be the last resolver
// in the chain. It applies to failed Node module resolution of modules and will attempt
// to resolve them to `expo` and `expo-router` dependencies that couldn't be resolved.
// This resolves isolated dependency issues, where we expect dependencies of `expo`
// and `expo-router` to be resolvable, due to hoisting, but they aren't hoisted in
// a user's project.
// See: https://github.com/expo/expo/pull/34286

import type { ResolutionContext } from 'metro-resolver';
import path from 'path';

import type { StrictResolver, StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

/** A record of dependencies that we know are only used for scripts and config-plugins
 * @privateRemarks
 * This includes dependencies we never resolve indirectly. Generally, we only want
 * to add fallback resolutions for dependencies of `expo` and `expo-router` that
 * are either transpiled into output code or resolved from other Expo packages
 * without them having direct dependencies on these dependencies.
 * Meaning: If you update this list, exclude what a user might use when they
 * forget to specify their own dependencies, rather than what we use ourselves
 * only in `expo` and `expo-router`.
 */
const EXCLUDE_ORIGIN_MODULES: Record<string, true | undefined> = {
  '@expo/config': true,
  '@expo/config-plugins': true,
  'schema-utils': true, // Used by `expo-router/plugin`
  semver: true, // Used by `expo-router/doctor`
};

interface PackageMetaPeerDependenciesMetaEntry {
  [propName: string]: unknown;
  optional?: boolean;
}

interface PackageMeta {
  readonly [propName: string]: unknown;
  readonly name?: string;
  readonly main?: string;
  readonly exports?: any; // unused
  readonly dependencies?: Record<string, unknown>;
  readonly peerDependencies?: Record<string, unknown>;
  readonly peerDependenciesMeta?: Record<
    string,
    PackageMetaPeerDependenciesMetaEntry | undefined | null
  >;
}

interface ModuleDescription {
  originModulePath: string;
  moduleTestRe: RegExp;
}

const debug = require('debug')('expo:start:server:metro:fallback-resolver') as typeof console.log;

/** Converts a list of module names to a regex that may either match bare module names or sub-modules of modules */
const dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(?:${dependencies.join('|')})(?:$|/)`);

/** Resolves an origin module and outputs a filter regex and target path for it */
const getModuleDescriptionWithResolver = (
  context: ResolutionContext,
  resolve: StrictResolver,
  originModuleName: string
): ModuleDescription | null => {
  let filePath: string | undefined;
  let packageMeta: PackageMeta | undefined | null;
  try {
    const resolution = resolve(`${originModuleName}/package.json`);
    if (resolution.type !== 'sourceFile') {
      debug(`Fallback module resolution failed for origin module: ${originModuleName})`);
      return null;
    }
    filePath = resolution.filePath;
    packageMeta = context.getPackage(filePath);
    if (!packageMeta) {
      return null;
    }
  } catch (error: any) {
    debug(
      `Fallback module resolution threw: ${error.constructor.name}. (module: ${filePath || originModuleName})`
    );
    return null;
  }
  let dependencies: string[] = [];
  if (packageMeta.dependencies) dependencies.push(...Object.keys(packageMeta.dependencies));
  if (packageMeta.peerDependencies) {
    const peerDependenciesMeta = packageMeta.peerDependenciesMeta;
    let peerDependencies = Object.keys(packageMeta.peerDependencies);
    // We explicitly include non-optional peer dependencies. Non-optional peer dependencies of
    // `expo` and `expo-router` are either expected to be accessible on a project-level, since
    // both are meant to be installed is direct dependencies, or shouldn't be accessible when
    // they're fulfilled as isolated dependencies.
    // The exception are only *optional* peer dependencies, since when they're installed
    // automatically by newer package manager behaviour, they may become isolated dependencies
    // that we still wish to access.
    if (peerDependenciesMeta) {
      peerDependencies = peerDependencies.filter((dependency) => {
        const peerMeta = peerDependenciesMeta[dependency];
        return peerMeta && typeof peerMeta === 'object' && peerMeta.optional === true;
      });
    }
    dependencies.push(...peerDependencies);
  }
  // We deduplicate the dependencies and exclude modules that we know are only used for scripts or config-plugins
  dependencies = dependencies.filter((moduleName, index, dependenciesArr) => {
    if (EXCLUDE_ORIGIN_MODULES[moduleName]) return false;
    return dependenciesArr.indexOf(moduleName) === index;
  });
  // Return test regex for dependencies and full origin module path to resolve through
  const originModulePath = path.dirname(filePath);
  return dependencies.length
    ? { originModulePath, moduleTestRe: dependenciesToRegex(dependencies) }
    : null;
};

/** Creates a fallback module resolver that resolves dependencis of modules named in `originModuleNames` via their path.
 * @remarks
 * The fallback resolver targets modules dependended on by modules named in `originModuleNames` and resolves
 * them from the module root of these origin modules instead.
 * It should only be used as a fallback after normal Node resolution (and other resolvers) have failed for:
 * - the `expo` package
 * - the `expo-router` package
 * Dependencies mentioned as either optional peer dependencies or direct dependencies by these modules may be isolated
 * and inaccessible via standard Node module resolution. This may happen when either transpilation adds these
 * dependencies to other parts of the tree (e.g. `@babel/runtime`) or when a dependency fails to hoist due to either
 * a corrupted dependency tree or when a peer dependency is fulfilled incorrectly (e.g. `expo-asset`)
 * @privateRemarks
 * This does NOT follow Node resolution and is *only* intended to provide a fallback for modules that we depend on
 * ourselves and know we can resolve (via expo or expo-router)!
 */
export function createFallbackModuleResolver({
  originModuleNames,
  getStrictResolver,
}: {
  originModuleNames: string[];
  getStrictResolver: StrictResolverFactory;
}): ExpoCustomMetroResolver {
  const _moduleDescriptionsCache: Record<string, ModuleDescription | null> = {};

  const getModuleDescription = (
    immutableContext: ResolutionContext,
    originModuleName: string,
    platform: string | null
  ) => {
    if (_moduleDescriptionsCache[originModuleName] !== undefined) {
      return _moduleDescriptionsCache[originModuleName];
    }
    // Resolve the origin module itself through `<module>/.`
    const context: ResolutionContext = {
      ...immutableContext,
      originModulePath: `${originModuleName}/package.json`,
    };
    return (_moduleDescriptionsCache[originModuleName] = getModuleDescriptionWithResolver(
      context,
      getStrictResolver(context, platform),
      originModuleName
    ));
  };

  const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;

  return function requestFallbackModule(immutableContext, moduleName, platform) {
    // Early return if `moduleName` cannot be a module specifier
    // This doesn't have to be accurate as this resolver is a fallback for failed resolutions and
    // we're only doing this to avoid unnecessary resolution work
    if (fileSpecifierRe.test(moduleName)) {
      return null;
    }

    for (const originModuleName of originModuleNames) {
      const moduleDescription = getModuleDescription(immutableContext, originModuleName, platform);
      if (moduleDescription && moduleDescription.moduleTestRe.test(moduleName)) {
        // We instead resolve as if it was depended on by the `originModulePath` (the module named in `originModuleNames`)
        const context: ResolutionContext = {
          ...immutableContext,
          nodeModulesPaths: [moduleDescription.originModulePath],
          originModulePath: moduleDescription.originModulePath,
        };
        const res = getStrictResolver(context, platform)(moduleName);
        debug(
          `Fallback resolution for ${platform}: ${moduleName} -> from origin: ${originModuleName}`
        );
        return res;
      }
    }

    return null;
  };
}
