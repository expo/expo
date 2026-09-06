import type commander from 'commander';
import fs from 'fs';

import { findModulesAsync } from '../autolinking/findModules';
import { generateModulesProviderAsync } from '../autolinking/generatePackageList';
import { resolveModulesAsync } from '../autolinking/resolveModules';
import type { SupportedPlatform } from '../types';
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
 * Warns about packages integrated at pod install that the generated provider won't link. A package
 * resolving with nothing to link is only worth reporting when the scan failed: the packages passed
 * here are every package whose pods support the target, so the ones that carry no modules at all
 * are expected to be among them, but a failed scan silently empties the ones whose classes it
 * would have found.
 */
export function warnAboutUnresolvedPackages(
  expectedPackageNames: string[],
  resolvedModules: { packageName: string; modules?: unknown[] }[],
  scanSucceeded: boolean
): void {
  const modulesByName = new Map(resolvedModules.map((module) => [module.packageName, module]));
  const emptyPackages: string[] = [];

  for (const packageName of expectedPackageNames) {
    const resolvedModule = modulesByName.get(packageName);
    if (!resolvedModule) {
      console.warn(
        `⚠️  Package '${packageName}' was integrated at pod install but is missing from the current resolution. Run pod install if it should still be linked.`
      );
    } else if (!scanSucceeded && !resolvedModule.modules?.length) {
      emptyPackages.push(packageName);
    }
  }

  if (emptyPackages.length > 0) {
    console.warn(
      `⚠️  Scanning for @ExpoModule classes didn't run to completion (see the warnings above), so these packages are linked with only what their module config declares: ${emptyPackages.join(', ')}. Any class that relies on being detected automatically is missing from this build.`
    );
  }
}

/** Generates a source file listing all packages to link in the runtime */
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
    .option(
      '--target-platform <platform>',
      'The concrete Apple platform the target builds for (ios, macos or tvos). Decides which conditionally compiled module classes are linked; without it every scanned class is linked.'
    )
    .option('--app-root <path>', 'Path to the app root directory.')
    .option('--podfile-properties-file-path <path>', 'Path to the Podfile properties file.')
    .action(
      async (searchPaths: string[] | null, commandArguments: GenerateModulesProviderArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        // Pods are resolved for the umbrella `apple` platform, but the modules provider is built
        // for one concrete target, which is what decides whether a conditionally compiled class
        // exists. Fall back to the umbrella when the caller doesn't say, linking every scanned class.
        const targetPlatform = commandArguments.targetPlatform ?? platform;
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
          { ...autolinkingOptions, platform: targetPlatform },
          // The provider generated here is the only consumer of the scanned classes, and it runs on
          // every build, so a scan that fails once is repaired by the next build rather than
          // persisting until the next pod install.
          {
            scanNativeModules: true,
            onScanResult: (succeeded) => (scanSucceeded = succeeded),
          }
        );

        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        warnAboutUnresolvedPackages(
          commandArguments.packages ?? [],
          filteredModules,
          scanSucceeded
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
      }
    );
}
