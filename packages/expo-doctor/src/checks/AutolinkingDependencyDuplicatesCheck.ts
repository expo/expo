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

    const corruptedInstallations: BaseDependencyResolution[] = [];
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

        // If all versions are identical then the node_modules folder is corrupted
        // This can happen if a package manager fails to clean up after itself when updating
        // and may look like this:
        // - expo-constants@18.0.2 (at: node_modules/expo-constants)
        // - expo-constants@18.0.2 (at: node_modules/expo/node_modules/expo-constants)
        // - expo-constants@18.0.2 (at: node_modules/expo-asset/node_modules/expo-constants)
        // Note that in this example, all versions are identical, but multiple
        // copies of the same version are installed
        if (dependency.version) {
          const areVersionsIdentical = dependency.duplicates.every((duplicate) => {
            return (
              duplicate.version &&
              duplicate.version === dependency.version &&
              /* NOTE(@kitten): We shouldn't have to compare here, but this is just in case there are weirder corruptions I can't think of */
              duplicate.originPath !== dependency.originPath
            );
          });
          if (areVersionsIdentical) corruptedInstallations.push(dependency);
        }
      }
    }

    const advice: string[] = [];
    if (issues.length) {
      if (corruptedInstallations.length) {
        advice.push(
          `Multiple copies of the same version exist for: ${corruptedInstallations.map((x) => x.name).join(', ')}.\n` +
            '- Try deleting your node_modules folders and reinstall your dependencies after.'
        );
      }
      advice.push(
        `Resolve your dependency issues and deduplicate your dependencies. ${learnMore('https://expo.fyi/resolving-dependency-issues')}`
      );
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}
