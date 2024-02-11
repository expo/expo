import type MetroConfig from 'metro-config';
import resolveFrom from 'resolve-from';

function importMetroConfigFromProject(projectDir: string): typeof MetroConfig {
  const resolvedPath = resolveFrom.silent(projectDir, 'metro-config');
  if (!resolvedPath) {
    throw new MetroConfigPackageMissingError(
      'Missing package "metro-config" in the project. ' +
        'This usually means `react-native` is not installed. ' +
        'Verify that dependencies in package.json include "react-native" ' +
        'and run `yarn` or `npm install`.'
    );
  }
  return require(resolvedPath);
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
