import type MetroConfig from 'metro-config';
import resolveFrom from 'resolve-from';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';

export class MetroConfigCheck implements DoctorCheck {
  description = 'Check for issues with metro config';

  sdkVersionRange = '>=46.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // configuration check and companion functions adapted from:
    // https://github.com/expo/eas-cli/blob/main/packages/eas-cli/src/project/metroConfig.ts
    if (await configExistsAsync(projectRoot)) {
      console.warn('config exists');
      const metroConfig = await loadConfigAsync(projectRoot);
      console.warn(metroConfig);
      const hasHashAssetFilesPlugin = metroConfig.transformer?.assetPlugins?.find(
        (plugin: string) => plugin.match(/expo-asset[/|\\]tools[/|\\]hashAssetFiles/)
      );
      if (!hasHashAssetFilesPlugin) {
        issues.push(
          'It looks like that you are using a custom metro.config.js that does not extend @expo/metro-config. This can lead to unexpected and hard to debug issues. ' +
            learnMore('https://docs.expo.dev/guides/customizing-metro/')
        );
      }
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? `Update your custom metro.config.js to extend @expo/metro-config.`
        : undefined,
    };
  }
}

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
