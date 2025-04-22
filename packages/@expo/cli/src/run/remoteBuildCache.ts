import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import fs from 'fs';
import resolveFrom from 'resolve-from';

import { type Options as AndroidRunOptions } from './android/resolveOptions';
import { type Options as IosRunOptions } from './ios/XcodeBuild.types';
import { EASRemoteBuildCacheProvider } from '../utils/remote-build-cache-providers/eas';

const debug = require('debug')('expo:run:remote-build') as typeof console.log;

export type ResolveRemoteBuildCacheProps = {
  projectRoot: string;
  platform: ModPlatform;
  runOptions: AndroidRunOptions | IosRunOptions;
  fingerprintHash: string;
};
export type UploadRemoteBuildCacheProps = {
  projectRoot: string;
  buildPath: string;
  runOptions: AndroidRunOptions | IosRunOptions;
  fingerprintHash: string;
  platform: ModPlatform;
};
export type CalculateFingerprintHashProps = {
  projectRoot: string;
  platform: ModPlatform;
  runOptions: AndroidRunOptions | IosRunOptions;
};

export type RemoteBuildCacheProvider<T = any> = {
  plugin: RemoteBuildCachePlugin<T>;
  options: T;
};

export type RemoteBuildCachePlugin<T = any> = {
  resolveRemoteBuildCache(props: ResolveRemoteBuildCacheProps, options: T): Promise<string | null>;
  uploadRemoteBuildCache(props: UploadRemoteBuildCacheProps, options: T): Promise<string | null>;
  calculateFingerprintHash?: (
    props: CalculateFingerprintHashProps,
    options: T
  ) => Promise<string | null>;
};

// Default plugin entry file name.
export const pluginFileName = 'buildCacheProvider.plugin.js';

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
    return { plugin: EASRemoteBuildCacheProvider, options: {} };
  }

  if (typeof provider === 'object' && typeof provider.plugin === 'function') {
    return provider as RemoteBuildCacheProvider;
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
  platform: ModPlatform;
  provider: RemoteBuildCacheProvider;
  runOptions: AndroidRunOptions | IosRunOptions;
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

  await provider.plugin.resolveRemoteBuildCache(
    { fingerprintHash, platform, runOptions, projectRoot },
    provider.options
  );

  return null;
}

export async function uploadRemoteBuildCache({
  projectRoot,
  platform,
  provider,
  buildPath,
  runOptions,
}: {
  projectRoot: string;
  platform: ModPlatform;
  provider: RemoteBuildCacheProvider;
  buildPath: string;
  runOptions: AndroidRunOptions | IosRunOptions;
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
  platform: ModPlatform;
  provider: RemoteBuildCacheProvider;
  runOptions: AndroidRunOptions | IosRunOptions;
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
  } catch {
    return null;
  }
}

// Resolve the module function and assert type
export function resolvePluginFunction(
  projectRoot: string,
  pluginReference: string
): RemoteBuildCachePlugin {
  const { filePath: pluginFile } = resolvePluginForModule(projectRoot, pluginReference);

  try {
    let plugin = require(pluginFile);

    if (plugin?.default != null) {
      plugin = plugin.default;
    }

    if (typeof plugin !== 'function') {
      throw new Error(`The provider plugin "${pluginReference}" must export a function.`);
    }
    return plugin;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Add error linking to the docs of how create a valid provider plugin
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
 *   2. If the reference a module? e.g. `expo-font`
 *     - Resolve the root `app.plugin.js` file within the module, e.g. `expo-font/app.plugin.js`
 *   3. Does the module have a valid provider plugin in the `main` field?
 *     - Resolve the `main` entry point as provider plugin
 */
function resolvePluginForModule(
  projectRoot: string,
  pluginReference: string
): { filePath: string } {
  if (moduleNameIsDirectFileReference(pluginReference)) {
    // Only resolve `./file.js`, `package/file.js`, `@org/package/file.js`
    const pluginScriptFile = resolveFrom.silent(projectRoot, pluginReference);
    if (pluginScriptFile) {
      return {
        filePath: pluginScriptFile,
      };
    }
  } else if (moduleNameIsPackageReference(pluginReference)) {
    // Only resolve `package -> package/app.plugin.js`, `@org/package -> @org/package/app.plugin.js`
    const pluginPackageFile = resolveFrom.silent(
      projectRoot,
      `${pluginReference}/${pluginFileName}`
    );
    if (pluginPackageFile && fileExists(pluginPackageFile)) {
      return { filePath: pluginPackageFile };
    }
    // Try to resole the `main` entry as config plugin
    const packageMainEntry = resolveFrom.silent(projectRoot, pluginReference);
    if (packageMainEntry) {
      return { filePath: packageMainEntry };
    }
  }

  throw new Error(
    `Failed to resolve provider plugin for module "${pluginReference}" relative to "${projectRoot}". Do you have node modules installed?`
  );
}

function moduleNameIsDirectFileReference(name: string): boolean {
  // Check if path is a file. Matches lines starting with: . / ~/
  if (name.match(/^(\.|~\/|\/)/g)) {
    return true;
  }

  const slashCount = name.split('/')?.length;
  // Orgs (like @expo/config ) should have more than one slash to be a direct file.
  if (name.startsWith('@')) {
    return slashCount > 2;
  }

  // Regular packages should be considered direct reference if they have more than one slash.
  return slashCount > 1;
}

function moduleNameIsPackageReference(name: string): boolean {
  const slashCount = name.split('/')?.length;
  return name.startsWith('@') ? slashCount === 2 : slashCount === 1;
}

export function fileExists(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
