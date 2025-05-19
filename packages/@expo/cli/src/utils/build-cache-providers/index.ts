import { ExpoConfig, BuildCacheProviderPlugin, BuildCacheProvider, RunOptions } from '@expo/config';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { moduleNameIsDirectFileReference, moduleNameIsPackageReference } from './helpers';
import * as Log from '../../log';
import { ensureDependenciesAsync } from '../../start/doctor/dependencies/ensureDependenciesAsync';
import { CommandError } from '../errors';

const debug = require('debug')('expo:run:build-cache-provider') as typeof console.log;

export const resolveBuildCacheProvider = async (
  provider: Required<Required<ExpoConfig>['experiments']>['buildCacheProvider'] | undefined,
  projectRoot: string
): Promise<BuildCacheProvider | undefined> => {
  if (!provider) {
    return;
  }

  if (provider === 'eas') {
    try {
      await ensureDependenciesAsync(projectRoot, {
        isProjectMutable: true,
        installMessage:
          'eas-build-cache-provider package is required to use the EAS build cache.\n',
        warningMessage: 'Unable to to use the EAS remote build cache.',
        requiredPackages: [
          {
            pkg: 'eas-build-cache-provider',
            file: 'eas-build-cache-provider/package.json',
            dev: true,
          },
        ],
      });

      // We need to manually load dependencies installed on the fly
      const plugin = await manuallyLoadDependency(projectRoot, 'eas-build-cache-provider');

      return {
        plugin: plugin.default ?? plugin,
        options: {},
      };
    } catch (error: any) {
      if (error instanceof CommandError) {
        Log.warn(error.message);
      } else {
        throw error;
      }
      return undefined;
    }
  }

  if (typeof provider === 'object' && typeof provider.plugin === 'string') {
    const plugin = resolvePluginFunction(projectRoot, provider.plugin);

    return { plugin, options: provider.options };
  }

  throw new Error('Invalid build cache provider');
};

export async function resolveBuildCache({
  projectRoot,
  platform,
  provider,
  runOptions,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  provider: BuildCacheProvider;
  runOptions: RunOptions;
}): Promise<string | null> {
  const fingerprintHash = await calculateFingerprintHashAsync({
    projectRoot,
    platform,
    provider,
    runOptions,
  });
  if (!fingerprintHash) {
    return null;
  }

  if ('resolveRemoteBuildCache' in provider.plugin) {
    Log.warn('The resolveRemoteBuildCache function is deprecated. Use resolveBuildCache instead.');
    return await provider.plugin.resolveRemoteBuildCache(
      { fingerprintHash, platform, runOptions, projectRoot },
      provider.options
    );
  }
  return await provider.plugin.resolveBuildCache(
    { fingerprintHash, platform, runOptions, projectRoot },
    provider.options
  );
}

export async function uploadBuildCache({
  projectRoot,
  platform,
  provider,
  buildPath,
  runOptions,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  provider: BuildCacheProvider;
  buildPath: string;
  runOptions: RunOptions;
}): Promise<void> {
  const fingerprintHash = await calculateFingerprintHashAsync({
    projectRoot,
    platform,
    provider,
    runOptions,
  });
  if (!fingerprintHash) {
    debug('No fingerprint hash found, skipping upload');
    return;
  }

  if ('uploadRemoteBuildCache' in provider.plugin) {
    Log.warn('The uploadRemoteBuildCache function is deprecated. Use uploadBuildCache instead.');
    await provider.plugin.uploadRemoteBuildCache(
      {
        projectRoot,
        platform,
        fingerprintHash,
        buildPath,
        runOptions,
      },
      provider.options
    );
  } else {
    await provider.plugin.uploadBuildCache(
      {
        projectRoot,
        platform,
        fingerprintHash,
        buildPath,
        runOptions,
      },
      provider.options
    );
  }
}

async function calculateFingerprintHashAsync({
  projectRoot,
  platform,
  provider,
  runOptions,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  provider: BuildCacheProvider;
  runOptions: RunOptions;
}): Promise<string | null> {
  if (provider.plugin.calculateFingerprintHash) {
    return await provider.plugin.calculateFingerprintHash(
      { projectRoot, platform, runOptions },
      provider.options
    );
  }

  const Fingerprint = importFingerprintForDev(projectRoot);
  if (!Fingerprint) {
    debug('@expo/fingerprint is not installed in the project, unable to calculate fingerprint');
    return null;
  }
  const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot);

  return fingerprint.hash;
}

function importFingerprintForDev(projectRoot: string): null | typeof import('@expo/fingerprint') {
  try {
    return require(require.resolve('@expo/fingerprint', { paths: [projectRoot] }));
  } catch (error: any) {
    if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

/**
 * Resolve the provider plugin from a node module or package.
 * If the module or package does not include a provider plugin, this function throws.
 * The resolution is done in following order:
 *   1. Is the reference a relative file path or an import specifier with file path? e.g. `./file.js`, `pkg/file.js` or `@org/pkg/file.js`?
 *     - Resolve the provider plugin as-is
 *   2. Does the module have a valid provider plugin in the `main` field?
 *     - Resolve the `main` entry point as provider plugin
 */
function resolvePluginFilePathForModule(projectRoot: string, pluginReference: string) {
  if (moduleNameIsDirectFileReference(pluginReference)) {
    // Only resolve `./file.js`, `package/file.js`, `@org/package/file.js`
    const pluginScriptFile = resolveFrom.silent(projectRoot, pluginReference);
    if (pluginScriptFile) {
      return pluginScriptFile;
    }
  } else if (moduleNameIsPackageReference(pluginReference)) {
    // Try to resole the `main` entry as config plugin
    return resolveFrom(projectRoot, pluginReference);
  }

  throw new Error(
    `Failed to resolve provider plugin for module "${pluginReference}" relative to "${projectRoot}". Do you have node modules installed?`
  );
}

// Resolve the module function and assert type
export function resolvePluginFunction(
  projectRoot: string,
  pluginReference: string
): BuildCacheProviderPlugin {
  const pluginFile = resolvePluginFilePathForModule(projectRoot, pluginReference);

  try {
    let plugin = require(pluginFile);
    if (plugin?.default != null) {
      plugin = plugin.default;
    }

    if (
      typeof plugin !== 'object' ||
      (typeof plugin.resolveRemoteBuildCache !== 'function' &&
        typeof plugin.resolveBuildCache !== 'function') ||
      (typeof plugin.uploadRemoteBuildCache !== 'function' &&
        typeof plugin.uploadBuildCache !== 'function')
    ) {
      throw new Error(`
        The provider plugin "${pluginReference}" must export an object containing
        the resolveBuildCache and uploadBuildCache functions.
      `);
    }
    return plugin;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Add error linking to the docs of how create a valid provider plugin
    }
    throw error;
  }
}

async function manuallyLoadDependency(projectRoot: string, packageName: string) {
  const possiblePaths = [
    path.join(projectRoot, 'node_modules'),
    ...(require.resolve.paths(packageName) ?? []),
  ];
  const nodeModulesFolder = possiblePaths?.find((p) => {
    const packagePath = path.join(p, packageName);
    return fs.existsSync(packagePath);
  });
  if (!nodeModulesFolder) {
    throw new Error(`Package ${packageName} not found in ${possiblePaths}`);
  }

  const { main } = await import(path.join(nodeModulesFolder, packageName, 'package.json'));
  return import(path.join(nodeModulesFolder, packageName, main));
}
