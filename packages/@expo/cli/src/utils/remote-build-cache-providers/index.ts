import {
  ExpoConfig,
  RemoteBuildCachePlugin,
  RemoteBuildCacheProvider,
  RunOptions,
} from '@expo/config';
import resolveFrom from 'resolve-from';

import { moduleNameIsDirectFileReference, moduleNameIsPackageReference } from './helpers';

const debug = require('debug')('expo:run:remote-build') as typeof console.log;

export const resolveRemoteBuildCacheProvider = (
  provider:
    | Required<Required<ExpoConfig>['experiments']>['remoteBuildCache']['provider']
    | undefined,
  projectRoot: string
): RemoteBuildCacheProvider | undefined => {
  if (!provider) {
    return;
  }

  if (provider === 'eas') {
    try {
      return {
        plugin: require.resolve('eas-build-cache-provider', {
          paths: [projectRoot],
        }) as unknown as RemoteBuildCachePlugin,
        options: {},
      };
    } catch (error: any) {
      if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
        console.warn(
          'The `eas-build-cache-provider` package is not installed. Please install it to use the EAS remote build cache.'
        );
      }
    }
  }

  if (typeof provider === 'object' && typeof provider.plugin === 'string') {
    const plugin = resolvePluginFunction(projectRoot, provider.plugin);

    return { plugin, options: provider.options };
  }

  throw new Error('Invalid remote build cache provider');
};

export async function resolveRemoteBuildCache({
  projectRoot,
  platform,
  provider,
  runOptions,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  provider: RemoteBuildCacheProvider;
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

  return await provider.plugin.resolveRemoteBuildCache(
    { fingerprintHash, platform, runOptions, projectRoot },
    provider.options
  );
}

export async function uploadRemoteBuildCache({
  projectRoot,
  platform,
  provider,
  buildPath,
  runOptions,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  provider: RemoteBuildCacheProvider;
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
}

async function calculateFingerprintHashAsync({
  projectRoot,
  platform,
  provider,
  runOptions,
}: {
  projectRoot: string;
  platform: 'android' | 'ios';
  provider: RemoteBuildCacheProvider;
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
    const packageMainEntry = resolveFrom.silent(projectRoot, pluginReference);
    if (packageMainEntry) {
      return packageMainEntry;
    }
  }

  throw new Error(
    `Failed to resolve provider plugin for module "${pluginReference}" relative to "${projectRoot}". Do you have node modules installed?`
  );
}

// Resolve the module function and assert type
export function resolvePluginFunction(
  projectRoot: string,
  pluginReference: string
): RemoteBuildCachePlugin {
  const pluginFile = resolvePluginFilePathForModule(projectRoot, pluginReference);

  try {
    let plugin = require(pluginFile);
    if (plugin?.default != null) {
      plugin = plugin.default;
    }

    if (
      typeof plugin !== 'object' ||
      typeof plugin.resolveRemoteBuildCache !== 'function' ||
      typeof plugin.uploadRemoteBuildCache !== 'function'
    ) {
      throw new Error(`
        The provider plugin "${pluginReference}" must export an object containing
        the resolveRemoteBuildCache and uploadRemoteBuildCache functions.
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
