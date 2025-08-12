import type MetroConfig from '@expo/metro/metro-config';
import path from 'path';
import resolveFrom from 'resolve-from';

function importMetroConfigFromProject(projectDir: string): typeof MetroConfig {
  const notFoundError = (basePackage: string): Error =>
    new MetroConfigPackageMissingError(
      `Missing package "${basePackage}" in the project. ` +
        `This usually means "${basePackage}" is not installed correctly. ` +
        `Verify that dependencies in package.json include "${basePackage}" ` +
        'and run `yarn` or `npm install`.'
    );

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

export async function configExistsAsync(projectRoot: string): Promise<boolean> {
  try {
    const MetroConfig = importMetroConfigFromProject(projectRoot);
    const result = await MetroConfig.resolveConfig(undefined, projectRoot);
    return !result.isEmpty;
  } catch (err) {
    if (err instanceof MetroConfigPackageMissingError) {
      return false;
    } else {
      throw err;
    }
  }
}

export async function loadConfigAsync(projectDir: string): Promise<MetroConfig.ConfigT> {
  const MetroConfig = importMetroConfigFromProject(projectDir);
  return await MetroConfig.loadConfig({ cwd: projectDir }, {});
}

class MetroConfigPackageMissingError extends Error {}
