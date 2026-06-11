import type { InputConfigT } from '@expo/metro/metro-config';
import path from 'path';
import resolveFrom from 'resolve-from';

const notFoundError = (basePackage: string): Error =>
  new MetroConfigPackageMissingError(
    `Missing package "${basePackage}" in the project. ` +
      `This usually means "${basePackage}" is not installed correctly. ` +
      `Verify that dependencies in package.json include "${basePackage}" ` +
      'and run `yarn` or `npm install`.'
  );

function importMetroConfigFromProject(
  projectDir: string
): typeof import('@expo/metro/metro-config') {
  const expoResolved = resolveFrom.silent(projectDir, 'expo/package.json');
  if (!expoResolved) {
    throw notFoundError('expo');
  }
  try {
    // NOTE(@kitten): We need to use the version of metro-config that Expo uses
    // Luckily, we can import `@expo/metro` via `expo` to get to the same version
    const expoMetro = require.resolve('@expo/metro/metro-config', {
      paths: [path.dirname(expoResolved)],
    });
    return require(expoMetro);
  } catch {
    // NOTE(@kitten): Older versions of expo will not have `@expo/metro`. Let's try to
    // require `metro-config` directly
    const metroConfig = resolveFrom.silent(projectDir, 'metro-config');
    if (!metroConfig) {
      throw notFoundError('react-native');
    }
    return require(metroConfig);
  }
}

let _expoMetroConfig: typeof import('expo/metro-config') | undefined;

function loadExpoMetroConfig(projectDir: string): typeof import('expo/metro-config') {
  if (_expoMetroConfig != null) {
    return _expoMetroConfig;
  }
  const expoMetroConfigResolved = resolveFrom.silent(projectDir, 'expo/metro-config');
  if (!expoMetroConfigResolved) {
    throw notFoundError('expo');
  }
  _expoMetroConfig = require(expoMetroConfigResolved);
  return _expoMetroConfig!;
}

export function getDefaultMetroConfig(projectRoot: string) {
  const expoMetroConfig = loadExpoMetroConfig(projectRoot);
  return expoMetroConfig.getDefaultConfig(projectRoot);
}

export async function loadMetroUserConfigAsync(
  projectRoot: string,
  serverRoot: string
): Promise<InputConfigT | null> {
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
