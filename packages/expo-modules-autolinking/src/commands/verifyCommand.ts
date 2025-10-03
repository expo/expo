import chalk from 'chalk';
import commander from 'commander';
import fs from 'fs';
import path from 'path';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import {
  type BaseDependencyResolution,
  type DependencyResolution,
  type ResolutionResult,
  DependencyResolutionSource,
  makeCachedDependenciesLinker,
  mergeResolutionResults,
  scanDependencyResolutionsForPlatform,
} from '../dependencies';

// NOTE(@kitten): These are excluded explicitly, but we want to include them for the verify command explicitly
const INCLUDE_PACKAGES = ['react-native', 'react-native-tvos'];

interface VerifyArguments extends AutolinkingCommonArguments {
  verbose?: boolean | null;
  json?: boolean | null;
}

export function verifyCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('verify'))
    .option('-v, --verbose', 'Output all results instead of just warnings.', () => true, false)
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .option(
      '-p, --platform [platform]',
      'The platform to validate native modules for. Available options: "android", "ios", "both"',
      'both'
    )
    .action(async (commandArguments: VerifyArguments) => {
      const platforms =
        commandArguments.platform === 'both' ? ['android', 'ios'] : [commandArguments.platform!];
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader(commandArguments);
      const appRoot = await autolinkingOptionsLoader.getAppRoot();
      const linker = makeCachedDependenciesLinker({ projectRoot: appRoot });
      const results = mergeResolutionResults(
        await Promise.all(
          platforms.map((platform) =>
            scanDependencyResolutionsForPlatform(linker, platform, INCLUDE_PACKAGES)
          )
        )
      );
      await verifySearchResults(results, {
        appRoot,
        verbose: !!commandArguments.verbose,
        json: !!commandArguments.json,
      });
    });
}

interface VerifyOptions {
  appRoot: string;
  verbose?: boolean;
  json?: boolean;
}

interface VerifyGroups {
  reactNativeProjectConfig: DependencyResolution[];
  searchPaths: DependencyResolution[];
  dependencies: DependencyResolution[];
  duplicates: DependencyResolution[];
}

/**
 * Verifies the search results by checking whether there are no duplicates.
 */
export async function verifySearchResults(
  results: ResolutionResult,
  options: VerifyOptions
): Promise<void> {
  const { appRoot } = options;

  async function getHumanReadableDependency(dependency: BaseDependencyResolution): Promise<string> {
    let version = dependency.version || null;
    if (!version) {
      try {
        const pkgContents = await fs.promises.readFile(
          path.join(dependency.path, 'package.json'),
          'utf8'
        );
        const pkg: unknown = JSON.parse(pkgContents);
        if (pkg && typeof pkg === 'object' && 'version' in pkg && typeof pkg.version === 'string') {
          version = pkg.version;
        }
      } catch (error) {
        version = null;
      }
    }
    const relative = path.relative(appRoot, dependency.originPath);
    return version
      ? `${dependency.name}@${version} (at: ${relative})`
      : `${dependency.name} at: ${relative}`;
  }

  const groups: VerifyGroups = {
    reactNativeProjectConfig: [],
    searchPaths: [],
    dependencies: [],
    duplicates: [],
  };

  for (const moduleName in results) {
    const revision = results[moduleName];
    if (!revision) {
      continue;
    } else if (revision.duplicates?.length) {
      groups.duplicates.push(revision);
    } else {
      switch (revision.source) {
        case DependencyResolutionSource.RN_CLI_LOCAL:
          groups.reactNativeProjectConfig.push(revision);
          break;
        case DependencyResolutionSource.SEARCH_PATH:
          groups.searchPaths.push(revision);
          break;
        case DependencyResolutionSource.RECURSIVE_RESOLUTION:
          groups.dependencies.push(revision);
          break;
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify(groups));
    return;
  }

  if (options.verbose) {
    const sortResolutions = (resolutions: DependencyResolution[]) =>
      [...resolutions].sort((a, b) => a.name.localeCompare(b.name));

    if (groups.reactNativeProjectConfig.length) {
      console.log(
        `🔎  Found ${groups.reactNativeProjectConfig.length} modules from React Native project config`
      );
      for (const revision of sortResolutions(groups.reactNativeProjectConfig)) {
        console.log(` - ${await getHumanReadableDependency(revision)}`);
      }
    }

    if (groups.searchPaths.length) {
      console.log(`🔎  Found ${groups.searchPaths.length} modules in search paths`);
      for (const revision of sortResolutions(groups.searchPaths)) {
        console.log(` - ${await getHumanReadableDependency(revision)}`);
      }
    }

    console.log(`🔎  Found ${groups.dependencies.length} modules in dependencies`);
    for (const revision of sortResolutions(groups.dependencies)) {
      console.log(` - ${await getHumanReadableDependency(revision)}`);
    }
  }

  if (groups.duplicates.length) {
    for (const revision of groups.duplicates) {
      console.warn(`⚠️  Found duplicate installations for ${chalk.green(revision.name)}`);
      const revisions = [revision, ...(revision.duplicates ?? [])];
      for (let idx = 0; idx < revisions.length; idx++) {
        const prefix = idx !== revisions.length - 1 ? '├─' : '└─';
        const duplicate = revisions[idx];
        console.log(`  ${prefix} ${await getHumanReadableDependency(duplicate)}`);
      }
    }

    console.warn(
      '⚠️  Multiple versions of the same module may introduce some side effects or compatibility issues.\n' +
        `Resolve your dependency issues and deduplicate your dependencies. Learn more: https://expo.fyi/resolving-dependency-issues`
    );
  } else {
    console.log('✅ Everything is fine!');
  }
}
