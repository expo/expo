import type { ResolutionContext } from 'metro-resolver';
import path from 'path';

import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const EXCLUDE_ORIGIN_MODULES: Record<string, true | undefined> = {
  '@expo/config': true,
  '@expo/config-plugins': true,
  'schema-utils': true,
  semver: true,
};

interface PackageMetaPeerDependenciesMetaEntry {
  [propName: string]: unknown;
  optional?: boolean;
}

interface PackageMeta {
  [propName: string]: unknown;
  dependencies?: Record<string, unknown>;
  peerDependencies?: Record<string, unknown>;
  peerDependenciesMeta?: Record<string, PackageMetaPeerDependenciesMetaEntry | undefined | null>;
}

interface ModuleDescription {
  originModuleName: string;
  originModulePath: string;
  moduleTestRe: RegExp;
}

const debug = require('debug')('expo:start:server:metro:fallback-resolver') as typeof console.log;

const dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(?:${dependencies.join('|')})(?:$|/)`);

const getModuleDescription = (originModuleName: string): ModuleDescription | null => {
  const metaPath = path.join(originModuleName, 'package.json');
  let originModulePath: string;
  let packageMeta: PackageMeta;
  try {
    originModulePath = path.dirname(require.resolve(metaPath));
    packageMeta = require(metaPath);
  } catch (error: any) {
    debug(`Node module resolution threw: ${error.constructor.name}. (module: ${originModuleName})`);
    return null;
  }
  let dependencies: string[] = [];
  if (packageMeta.dependencies) dependencies.push(...Object.keys(packageMeta.dependencies));
  if (packageMeta.peerDependencies) {
    const peerDependenciesMeta = packageMeta.peerDependenciesMeta;
    let peerDependencies = Object.keys(packageMeta.peerDependencies);
    if (peerDependenciesMeta) {
      peerDependencies = peerDependencies.filter((dependency) => {
        const peerMeta = peerDependenciesMeta[dependency];
        return peerMeta && typeof peerMeta === 'object' && peerMeta.optional === true;
      });
    }
    dependencies.push(...peerDependencies);
  }
  dependencies = dependencies.filter((moduleName, index, dependenciesArr) => {
    if (EXCLUDE_ORIGIN_MODULES[moduleName]) return false;
    return dependenciesArr.indexOf(moduleName) === index;
  });
  return dependencies.length
    ? { originModuleName, originModulePath, moduleTestRe: dependenciesToRegex(dependencies) }
    : null;
};

export function createFallbackModuleResolver({
  originModuleNames,
  getStrictResolver,
}: {
  originModuleNames: string[];
  getStrictResolver: StrictResolverFactory;
}): ExpoCustomMetroResolver {
  const moduleDescriptions = originModuleNames
    .map(getModuleDescription)
    .filter(
      (moduleDescription): moduleDescription is ModuleDescription => moduleDescription != null
    );

  return function requestFallbackModule(immutableContext, moduleName, platform) {
    if (moduleName[0] === '.' || moduleName[0] === '/') {
      return null;
    }

    for (const { originModuleName, originModulePath, moduleTestRe } of moduleDescriptions) {
      if (moduleTestRe.test(moduleName)) {
        const context: ResolutionContext = {
          ...immutableContext,
          nodeModulesPaths: [originModulePath],
          originModulePath,
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
