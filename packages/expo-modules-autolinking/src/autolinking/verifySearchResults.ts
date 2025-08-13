import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import {
  BaseDependencyResolution,
  DependencyResolution,
  DependencyResolutionSource,
  ResolutionResult,
} from '../dependencies';

interface VerifyOptions {
  projectRoot: string;
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
  const { projectRoot } = options;

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
    const relative = path.relative(projectRoot, dependency.originPath);
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
    if (groups.reactNativeProjectConfig.length) {
      console.log(
        `🔎  Found ${groups.reactNativeProjectConfig.length} modules from React Native project config`
      );
      for (const revision of groups.reactNativeProjectConfig) {
        console.log(` - ${await getHumanReadableDependency(revision)}`);
      }
    }

    if (groups.searchPaths.length) {
      console.log(`🔎  Found ${groups.searchPaths.length} modules in search paths`);
      for (const revision of groups.searchPaths) {
        console.log(` - ${await getHumanReadableDependency(revision)}`);
      }
    }

    console.log(`🔎  Found ${groups.dependencies.length} modules in dependencies`);
    for (const revision of groups.dependencies) {
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
