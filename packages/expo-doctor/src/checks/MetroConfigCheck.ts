import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import {
  configExistsAsync,
  loadConfigAsync,
  loadExpoMetroConfig,
} from '../utils/metroConfigLoader';

const isSubsetOf = (
  defaultValues: readonly string[] | undefined,
  userValues: readonly string[]
) => {
  const _userValues = new Set(userValues);
  const isSubset = (defaultValues ?? []).every((value) => _userValues.has(value));
  return isSubset;
};

export class MetroConfigCheck implements DoctorCheck {
  description = 'Check for issues with Metro config';

  sdkVersionRange = '>=51.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    if (!(await configExistsAsync(projectRoot))) {
      return {
        isSuccessful: true,
        issues: [],
        advice: [],
      };
    }

    const userConfig = await loadConfigAsync(projectRoot);

    if (userConfig.transformer && !('_expoRelativeProjectRoot' in userConfig.transformer)) {
      // If this Expo property isn't set, which is used for cache invalidation, we don't have an Expo-based config
      return {
        isSuccessful: false,
        issues: [
          'It looks like that you are using a custom metro.config.js that does not extend "expo/metro-config". This can lead to unexpected and hard to debug issues. ' +
            learnMore('https://docs.expo.dev/guides/customizing-metro/'),
        ],
        advice: [`Update your "metro.config.js" to extend "expo/metro-config".`],
      };
    }

    const resolvePath = (target: string) => path.normalize(path.resolve(projectRoot, target));

    const isPathsSubsetOf = (
      defaultPaths: readonly string[] | undefined,
      userPaths: readonly string[] | undefined
    ) => isSubsetOf(defaultPaths?.map(resolvePath), userPaths?.map(resolvePath) ?? []);

    const expoMetroConfig = await loadExpoMetroConfig(projectRoot);
    const defaultConfig = expoMetroConfig.getDefaultConfig(projectRoot);

    if (!isPathsSubsetOf(defaultConfig.watchFolders, userConfig.watchFolders)) {
      issues.push(`- "watchFolders" does not contain all entries from Expo's defaults`);
    }

    if (userConfig.resolver) {
      // `nodeModulesPaths` is likely to be empty, except in monorepos. But this setting
      // usually doesn't matter as much. We still apply checks, but don't expect this to
      // fail often
      if (
        !isPathsSubsetOf(
          defaultConfig.resolver?.nodeModulesPaths,
          userConfig.resolver?.nodeModulesPaths
        )
      ) {
        issues.push(
          `- "resolver.nodeModulesPaths" does not contain all entries from Expo's defaults`
        );
      }

      // Users sometimes move source extensions to assets, and vice versa, so we can only check for completeness
      // by checking across both simultaneously
      const defaultExts = [
        ...(defaultConfig.resolver?.sourceExts ?? []),
        ...(defaultConfig.resolver?.assetExts ?? []),
      ];
      const userExts = [
        ...(userConfig.resolver?.sourceExts ?? []),
        ...(userConfig.resolver?.assetExts ?? []),
      ];
      if (!isSubsetOf(defaultExts, userExts)) {
        issues.push(
          `- "resolver.sourceExts" and "resolver.assetExts" miss values from Expo's default extensions`
        );
      }
    }

    const compareConfigEntries = [
      ['projectRoot'],
      ['resolver', 'disableHierarchicalLookup'],
      ['resolver', 'unstable_allowRequireContext'],
      ['resolver', 'unstable_enableSymlinks'],
    ] as const;
    for (const configEntryPath of compareConfigEntries) {
      if (userConfig[configEntryPath[0]] === undefined) {
        continue;
      }
      const defaultValue = configEntryPath.reduce((acc, key) => acc?.[key], defaultConfig as any);
      const userValue = configEntryPath.reduce((acc, key) => acc?.[key], userConfig as any);
      if (defaultValue !== userValue) {
        issues.push(
          `- "${configEntryPath.join('.')}" mismatch. Expected ${defaultValue}, got: ${userValue}`
        );
      }
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? [
            'Modifying the "metro.config.js" is dangerous and may lead to unintended consequences.\n' +
              'Unless you know what these overrides do, remove them and adopt the recommended values from "expo/metro-config".',
          ]
        : [],
    };
  }
}
