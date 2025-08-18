import type {
  BaseDependencyResolution,
  DependencyResolution,
} from 'expo-modules-autolinking/exports';
import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import {
  ExpoExportMissingError,
  importAutolinkingExportsFromProject,
} from '../utils/autolinkingExportsLoader';
import { getVersionedNativeModuleNamesAsync } from '../utils/versionedNativeModules';

const AUTOLINKING_PLATFORMS = ['android', 'ios'] as const;

export class AutolinkingDependencyDuplicatesCheck implements DoctorCheck {
  description = 'Check that no duplicate dependencies are installed';

  sdkVersionRange = '>=54.0.0';

  async runAsync({ projectRoot, exp }: DoctorCheckParams): Promise<DoctorCheckResult> {
    let autolinking: ReturnType<typeof importAutolinkingExportsFromProject>;
    try {
      autolinking = importAutolinkingExportsFromProject(projectRoot);
    } catch (error) {
      if (error instanceof ExpoExportMissingError) {
        return {
          isSuccessful: false,
          issues: [error.message],
          advice: ["Reinstall your dependencies and check that they're not in a corrupted state."],
        };
      } else {
        return {
          isSuccessful: true,
          issues: [],
          advice: [],
        };
      }
    }

    const bundledNativeModules = await getVersionedNativeModuleNamesAsync(
      projectRoot,
      exp.sdkVersion!
    );
    const packagesWithIssues = new Map<string, DependencyResolution>();

    const linker = autolinking.makeCachedDependenciesLinker({ projectRoot });
    const dependenciesPerPlatform = await Promise.all(
      AUTOLINKING_PLATFORMS.map((platform) => {
        return autolinking.scanDependencyResolutionsForPlatform(
          linker,
          platform,
          bundledNativeModules || undefined
        );
      })
    );

    for (const dependencyForPlatform of dependenciesPerPlatform) {
      for (const dependencyName in dependencyForPlatform) {
        const dependency = dependencyForPlatform[dependencyName];
        if (!dependency || packagesWithIssues.has(dependencyName)) {
          continue;
        } else if (dependency.duplicates && dependency.duplicates.length > 0) {
          packagesWithIssues.set(dependencyName, dependency);
        }
      }
    }

    const issues: string[] = [];
    if (packagesWithIssues.size) {
      issues.unshift(
        'Your project contains duplicate native module dependencies, which should be de-duplicated.\n' +
          'Native builds may only contain one version of any given native module, and having multiple versions of a single Native module installed may lead to unexpected build errors.'
      );
    }

    async function getHumanReadableDependency(
      dependency: BaseDependencyResolution
    ): Promise<string> {
      let version = dependency.version || null;
      if (!version) {
        try {
          const pkgContents = await fs.promises.readFile(
            path.join(dependency.path, 'package.json'),
            'utf8'
          );
          const pkg: unknown = JSON.parse(pkgContents);
          if (
            pkg &&
            typeof pkg === 'object' &&
            'version' in pkg &&
            typeof pkg.version === 'string'
          ) {
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

    for (const dependency of packagesWithIssues.values()) {
      if (dependency.duplicates?.length) {
        const line = [`Found duplicates for ${dependency.name}:`];
        const versions = [dependency, ...dependency.duplicates];
        for (let idx = 0; idx < versions.length; idx++) {
          const prefix = idx !== versions.length - 1 ? '├─' : '└─';
          const duplicate = versions[idx];
          line.push(`  ${prefix} ${await getHumanReadableDependency(duplicate)}`);
        }
        issues.push(line.join('\n'));
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length
        ? [
            `Resolve your dependency issues and deduplicate your dependencies. ${learnMore('https://expo.fyi/resolving-dependency-issues')}`,
          ]
        : [],
    };
  }
}
