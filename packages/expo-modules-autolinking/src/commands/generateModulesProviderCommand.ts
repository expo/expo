import type commander from 'commander';
import fs from 'fs';

import { findModulesAsync } from '../autolinking/findModules';
import { generateModulesProviderAsync } from '../autolinking/generatePackageList';
import { resolveModulesAsync } from '../autolinking/resolveModules';
import type { ModuleIosConfig } from '../types';
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
 * Verifies that every package integrated at pod install (the `--packages` argument, gated back
 * then on having something to link) still resolves with something to link. Resolving with nothing
 * is always stale state: the `@ExpoModule` scan failed on this run, or the module config changed
 * since pod install. Generating the provider anyway would silently drop the package's modules from
 * the app, so the build stops early with the remedy instead. A package missing from the resolution
 * entirely only warns, since that can have more causes (e.g. changed search paths).
 */
export function verifyPackagesHaveSomethingToLink(
  expectedPackageNames: string[],
  resolvedModules: {
    packageName: string;
    modules?: ModuleIosConfig[];
    appDelegateSubscribers?: string[];
    reactDelegateHandlers?: string[];
  }[]
): void {
  const modulesByName = new Map(resolvedModules.map((module) => [module.packageName, module]));
  const emptyPackages: string[] = [];

  for (const packageName of expectedPackageNames) {
    const module = modulesByName.get(packageName);
    if (!module) {
      console.warn(
        `⚠️  Package '${packageName}' was integrated at pod install but is missing from the current resolution. Run pod install if it should still be linked.`
      );
      continue;
    }
    const hasSomethingToLink =
      (module.modules?.length ?? 0) > 0 ||
      (module.appDelegateSubscribers?.length ?? 0) > 0 ||
      (module.reactDelegateHandlers?.length ?? 0) > 0;
    if (!hasSomethingToLink) {
      emptyPackages.push(packageName);
    }
  }

  if (emptyPackages.length > 0) {
    throw new Error(
      `The following packages were integrated at pod install for their native modules, but resolve with nothing to link now: ${emptyPackages.join(', ')}. ` +
        `Either the @ExpoModule scan failed on this run (see the warnings above) or expo-module.config.json changed since pod install. ` +
        `Generating the modules provider anyway would build an app with these modules missing, so this build stops early instead. Run pod install to reintegrate the packages.`
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
          autolinkingOptions
        );

        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        verifyPackagesHaveSomethingToLink(commandArguments.packages ?? [], filteredModules);

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
