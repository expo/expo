import type {
  BaseDependencyResolution,
  DependencyResolution,
} from 'expo-modules-autolinking/exports';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { importAutolinkingExportsFromProject } from '../utils/autolinkingExportsLoader';
import { getVersionedNativeModuleNamesAsync } from '../utils/versionedNativeModules';

const AUTOLINKING_PLATFORMS = ['android', 'ios'] as const;

export class AutolinkingDependencyDuplicatesCheck implements DoctorCheck {
  description = 'Check that no duplicate dependencies are installed';

  sdkVersionRange = '>=54.0.0';

  async runAsync({ projectRoot, exp }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const autolinking = importAutolinkingExportsFromProject(projectRoot);
    if (!autolinking) {
      return {
        isSuccessful: true,
        issues: [],
        advice: [],
      };
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

    function getHumanReadableDependency(dependency: BaseDependencyResolution): string {
      const name = dependency.version
        ? `${dependency.name}@${dependency.version}`
        : dependency.name;
      const relative = path.relative(projectRoot, dependency.originPath);
      return `${name} (at: ${relative})`;
    }

    for (const dependency of packagesWithIssues.values()) {
      if (dependency.duplicates?.length) {
        const line = [`Found duplicates for ${getHumanReadableDependency(dependency)}:`];
        for (let idx = 0; idx < dependency.duplicates.length; idx++) {
          const prefix = idx !== dependency.duplicates.length - 1 ? '├─' : '└─';
          const duplicate = dependency.duplicates[idx];
          line.push(`  ${prefix} ${getHumanReadableDependency(duplicate)}`);
        }
        issues.push(line.join('\n'));
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      // TODO: We should either determine the package manager and output per-package-manager advice for deduplication
      // or, if `expo install --check` has failed, let the user do that first, if there's any overlap,
      // or have an fyi page
      advice: [],
    };
  }
}
