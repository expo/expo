import type commander from 'commander';
import fs from 'fs';

import { findModulesAsync } from '../autolinking/findModules';
import { generateModulesProviderAsync } from '../autolinking/generatePackageList';
import { resolveModulesAsync } from '../autolinking/resolveModules';
import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';

interface GenerateModulesProviderArguments extends AutolinkingCommonArguments {
  target: string;
  targetName?: string;
  podfilePropertiesFilePath: string;
  entitlement?: string;
  packages?: string[] | null;
  appRoot?: string;
}

type PartialPodfileProperties = {
  'expo.inlineModules.watchedDirectories'?: string;
  'expo.inlineModules.xcodeProjectTargets'?: string;
};

/**
 * Warns about packages that were integrated at pod install but are missing from the current
 * resolution, which means the generated provider will not link them. A package resolving with
 * nothing to link is not reported: the packages passed here are every package whose pods support
 * the target, so the ones that carry no modules at all are expected to be among them.
 */
export function warnAboutUnresolvedPackages(
  expectedPackageNames: string[],
  resolvedModules: { packageName: string }[]
): void {
  const resolvedNames = new Set(resolvedModules.map((module) => module.packageName));

  for (const packageName of expectedPackageNames) {
    if (!resolvedNames.has(packageName)) {
      console.warn(
        `⚠️  Package '${packageName}' was integrated at pod install but is missing from the current resolution. Run pod install if it should still be linked.`
      );
    }
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
        const expoModulesResolveResults = await resolveModulesAsync(
          expoModulesSearchResults,
          autolinkingOptions,
          // The provider generated here is the only consumer of the scanned classes, and it runs on
          // every build, so a scan that fails once is repaired by the next build rather than
          // persisting until the next pod install.
          { scanNativeModules: true }
        );

        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        warnAboutUnresolvedPackages(commandArguments.packages ?? [], filteredModules);

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
