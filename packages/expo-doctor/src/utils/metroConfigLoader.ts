import path from 'path';
import resolveFrom from 'resolve-from';

import { dynamicRequire } from './dynamicRequire';

type ExpoMetroConfigModule = typeof import('expo/metro-config');

/** The user's Metro config, as returned by `loadUserConfig` from `expo/metro-config`. */
export type MetroUserConfig = Awaited<ReturnType<ExpoMetroConfigModule['loadUserConfig']>>;

/**
 * The parts of `metro-config` used to load a user config on SDKs whose `expo/metro-config`
 * predates `loadUserConfig`.
 */
interface LegacyMetroConfigModule {
  resolveConfig(
    filePath: string | undefined,
    cwd: string
  ): Promise<{ filepath: string; isEmpty: boolean }>;
  loadConfig(
    argv: { cwd: string; config: string },
    defaultConfigOverrides: object
  ): Promise<MetroUserConfig>;
}

const notFoundError = (basePackage: string): Error =>
  new MetroConfigPackageMissingError(
    `Missing package "${basePackage}" in the project. ` +
      `This usually means "${basePackage}" is not installed correctly. ` +
      `Verify that dependencies in package.json include "${basePackage}" ` +
      'and run `yarn` or `npm install`.'
  );

function importMetroConfigFromProject(projectDir: string): LegacyMetroConfigModule {
  const expoResolved = resolveFrom.silent(projectDir, 'expo/package.json');
  if (!expoResolved) {
    throw notFoundError('expo');
  }
  try {
    // NOTE(@kitten): We need to use the version of metro-config that Expo uses
    // Luckily, we can import `@expo/metro` via `expo` to get to the same version
    const expoMetro = dynamicRequire.resolve('@expo/metro/metro-config', {
      paths: [path.dirname(expoResolved)],
    });
    return dynamicRequire(expoMetro);
  } catch {
    // NOTE(@kitten): Older versions of expo will not have `@expo/metro`. Let's try to
    // require `metro-config` directly
    const metroConfig = resolveFrom.silent(projectDir, 'metro-config');
    if (!metroConfig) {
      throw notFoundError('react-native');
    }
    return dynamicRequire(metroConfig);
  }
}

let _expoMetroConfig: ExpoMetroConfigModule | undefined;

function loadExpoMetroConfig(projectDir: string): ExpoMetroConfigModule {
  if (_expoMetroConfig != null) {
    return _expoMetroConfig;
  }
  const expoMetroConfigResolved = resolveFrom.silent(projectDir, 'expo/metro-config');
  if (!expoMetroConfigResolved) {
    throw notFoundError('expo');
  }
  _expoMetroConfig = dynamicRequire(expoMetroConfigResolved);
  return _expoMetroConfig!;
}

export function getDefaultMetroConfig(projectRoot: string) {
  const expoMetroConfig = loadExpoMetroConfig(projectRoot);
  return expoMetroConfig.getDefaultConfig(projectRoot);
}

export async function loadMetroUserConfigAsync(
  projectRoot: string,
  serverRoot: string
): Promise<MetroUserConfig | null> {
  const expoMetroConfig = loadExpoMetroConfig(projectRoot);
  // NOTE(@kitten): This API was added later on
  if ('loadUserConfig' in expoMetroConfig) {
    return await expoMetroConfig.loadUserConfig({ projectRoot, serverRoot });
  } else {
    try {
      const MetroConfig = importMetroConfigFromProject(projectRoot);
      // `loadConfig` adds the metro defaults when no config exists, so we need to manually check
      // if a user config exists first and bail out if it doesn't
      const { filepath, isEmpty } = await MetroConfig.resolveConfig(undefined, projectRoot);
      if (isEmpty) {
        return null;
      }
      return await MetroConfig.loadConfig(
        {
          cwd: projectRoot,
          config: filepath,
        },
        {}
      );
    } catch {
      // If we can't load the config, we assume it doesn't exist
      return null;
    }
  }
}

class MetroConfigPackageMissingError extends Error {}
