import chalk from 'chalk';
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
  AutolinkingResolutionsCache,
  scanNativeModuleResolutions,
} from '../utils/autolinkingResolutions';

const STORE_PATH = /node_modules[\\/]\.(?:bun|pnpm)[\\/]/;

type DoctorCache = AutolinkingResolutionsCache;

export class AutolinkingDependencyDuplicatesCheck implements DoctorCheck<DoctorCache> {
  description = 'Check that no duplicate dependencies are installed';

  sdkVersionRange = '>=54.0.0';

  async runAsync(
    { projectRoot, exp }: DoctorCheckParams,
    cache: DoctorCache
  ): Promise<DoctorCheckResult> {
    const packagesWithIssues = new Map<string, DependencyResolution>();

    try {
      const resolutions = await scanNativeModuleResolutions(cache, {
        projectRoot,
        sdkVersion: exp.sdkVersion!,
      });
      for (const [dependencyName, dependency] of resolutions) {
        if (dependency.duplicates && dependency.duplicates.length > 0) {
          packagesWithIssues.set(dependencyName, dependency);
        }
      }
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

    const issues: string[] = [];
    if (packagesWithIssues.size) {
      issues.unshift(
        'Your project contains duplicate native module dependencies, which should be de-duplicated.\n' +
          'Native builds may only contain one version of any given native module, and having multiple versions of a single Native module installed may lead to unexpected build errors.'
      );
    }

    function getDependencyVersion(dependency: BaseDependencyResolution): string | null {
      if (!dependency.version) {
        const pkgContents = fs.readFileSync(path.join(dependency.path, 'package.json'), 'utf8');
        try {
          const pkg: unknown = JSON.parse(pkgContents);
          if (
            pkg &&
            typeof pkg === 'object' &&
            'version' in pkg &&
            typeof pkg.version === 'string'
          ) {
            dependency.version = pkg.version;
          }
        } catch {
          dependency.version = '';
        }
      }
      return dependency.version || null;
    }

    async function getHumanReadableDependency(
      dependency: BaseDependencyResolution
    ): Promise<string> {
      const version = getDependencyVersion(dependency);
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
        const hasStorePaths = versions.some((version) => STORE_PATH.test(version.originPath));
        for (let idx = 0; idx < versions.length; idx++) {
          const prefix = idx !== versions.length - 1 ? '├─' : '└─';
          const duplicate = versions[idx];
          line.push(`  ${prefix} ${await getHumanReadableDependency(duplicate)}`);
          // If some duplicates are isolated store paths, but not all, we display the real path
          // of the non store paths to assure the user that this check is aware of isolated dependencies
          if (
            hasStorePaths &&
            duplicate.originPath !== duplicate.path &&
            STORE_PATH.test(duplicate.path)
          ) {
            const linkedOutput = !STORE_PATH.test(duplicate.originPath)
              ? `linked to: ${path.relative(projectRoot, dependency.path)}`
              : 'linked to a different installation';
            const prefix = idx !== versions.length - 1 ? '│' : ' ';
            line.push(`  ${prefix}  ` + chalk.grey(`└─ ${linkedOutput}`));
          }
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
              getDependencyVersion(duplicate) === getDependencyVersion(dependency) &&
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
          `Your node_modules folder may be corrupted. Multiple copies of the same version exist for: ${corruptedInstallations.map((x) => x.name).join(', ')}.\n` +
            '- Try deleting your node_modules folders and reinstall your dependencies after.\n' +
            '- If this error persists, delete your node_modules as well as your lockfile and reinstall.'
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
