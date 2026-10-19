import type commander from 'commander';
import { Option } from 'commander';
import fs from 'fs';

import { findModulesAsync } from '../autolinking/findModules';
import { generateModulesProviderAsync } from '../autolinking/generatePackageList';
import { resolveModulesAsync } from '../autolinking/resolveModules';
import { hasModuleAnnotations } from '../platforms/apple/moduleScanner';
import type { SearchResults, SupportedPlatform } from '../types';
import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';

interface GenerateModulesProviderArguments extends AutolinkingCommonArguments {
  target: string;
  targetName?: string;
  podfilePropertiesFilePath: string;
  entitlement?: string;
  packages?: string[] | null;
  targetPlatform?: SupportedPlatform;
  appRoot?: string;
}

type PartialPodfileProperties = {
  'expo.inlineModules.watchedDirectories'?: string;
  'expo.inlineModules.xcodeProjectTargets'?: string;
};

/**
 * Warns about expected packages missing from the resolution. When the scan failed, returns the
 * packages left empty that don't declare their modules but have `@ExpoModule` in their sources.
 */
export function findPackagesMissingScannedModules(
  expectedPackageNames: string[],
  resolvedModules: { packageName: string; modules?: unknown[] }[],
  scanSucceeded: boolean,
  searchResults: SearchResults
): string[] {
  const modulesByName = new Map(resolvedModules.map((module) => [module.packageName, module]));
  const packagesMissingModules: string[] = [];

  for (const packageName of expectedPackageNames) {
    const resolvedModule = modulesByName.get(packageName);
    if (!resolvedModule) {
      console.warn(
        `warning: Package '${packageName}' was integrated at pod install but is missing from the current resolution. Run pod install if it should still be linked.`
      );
      continue;
    }
    const revision = searchResults[packageName];
    if (
      !scanSucceeded &&
      !resolvedModule.modules?.length &&
      revision &&
      !revision.config?.declaresAppleModules() &&
      hasModuleAnnotations(revision.path)
    ) {
      packagesMissingModules.push(packageName);
    }
  }
  return packagesMissingModules;
}

export function generateModulesProviderCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('generate-modules-provider [searchPaths...]'))
    .option(
      '-t, --target <path>',
      'Path to the target file, where the package list should be written to.'
    )
    .option(
      '--target-name <name>',
      'Name of the user target the package list is generated for. Used to match against the inline modules targets.'
    )
    .option('--entitlement <path>', 'Path to the Apple code signing entitlements file.')
    .option(
      '-p, --packages <packages...>',
      'Names of the packages to include in the generated modules provider.'
    )
    .addOption(
      new Option(
        '--target-platform <platform>',
        'The concrete Apple platform the target builds for. Decides which conditionally compiled module classes are linked; without it every scanned class is linked.'
      ).choices(['ios', 'macos', 'tvos'])
    )
    .option('--app-root <path>', 'Path to the app root directory.')
    .option('--podfile-properties-file-path <path>', 'Path to the Podfile properties file.')
    .action(
      async (searchPaths: string[] | null, commandArguments: GenerateModulesProviderArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
          ...commandArguments,
          searchPaths,
        });
        const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);

        const appRoot = commandArguments.appRoot ?? (await autolinkingOptionsLoader.getAppRoot());
        const expoModulesSearchResults = await findModulesAsync({
          autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
          appRoot,
        });
        let scanSucceeded = false;
        const expoModulesResolveResults = await resolveModulesAsync(
          expoModulesSearchResults,
          { ...autolinkingOptions, platform },
          // Runs on every build, so a failed scan is retried by the next one.
          {
            scanNativeModules: true,
            scanPlatform: commandArguments.targetPlatform,
            onScanResult: (succeeded) => (scanSucceeded = succeeded),
          }
        );

        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        const packagesMissingModules = findPackagesMissingScannedModules(
          commandArguments.packages ?? [],
          filteredModules,
          scanSucceeded,
          expoModulesSearchResults
        );

        const podfileProperties: PartialPodfileProperties = await fs.promises
          .readFile(commandArguments.podfilePropertiesFilePath, {
            encoding: 'utf8',
          })
          .then((file) => JSON.parse(file))
          .catch(() => ({}));

        const watchedDirectories = JSON.parse(
          podfileProperties['expo.inlineModules.watchedDirectories'] ?? '[]'
        );

        const inlineModulesTargets = JSON.parse(
          podfileProperties['expo.inlineModules.xcodeProjectTargets'] ?? '{"targets":[]}'
        );

        await generateModulesProviderAsync(filteredModules, {
          platform,
          targetPath: commandArguments.target,
          targetName: commandArguments.targetName,
          entitlementPath: commandArguments.entitlement ?? null,
          watchedDirectories,
          inlineModulesTargets,
          appRoot,
        });

        // Otherwise the app would fail at runtime with a missing native module.
        if (packagesMissingModules.length > 0) {
          console.error(
            `error: Scanning for @ExpoModule classes didn't complete (see the warnings above), so the module classes of these packages are missing from the modules provider: ${packagesMissingModules.join(', ')}. Build again to retry the scan, or declare the classes in the package's expo-module.config.json.`
          );
          process.exitCode = 1;
        }
      }
    );
}
