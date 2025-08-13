import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { Log } from '../utils/log';
import { getVersionedNativeModuleNamesAsync } from '../utils/versionedNativeModules';

interface PackageJson {
  name: string;
  version: string;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

export class PeerDependencyChecks implements DoctorCheck {
  description = 'Check that required peer dependencies are installed';

  sdkVersionRange = '*';

  async runAsync({ pkg, projectRoot, exp }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    const allDependencies = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (!allDependencies || Object.keys(allDependencies).length === 0) {
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
    if (!bundledNativeModules) {
      // If we can't get bundled native modules, return early to avoid false positives
      return {
        isSuccessful: true,
        issues: [],
        advice: [],
      };
    }

    const peerDependencyIssues = (
      await Promise.all(
        Object.keys(allDependencies).map((packageName) =>
          this.checkPackagePeerDependencies(packageName, projectRoot, allDependencies)
        )
      )
    ).flat();

    const bundledNativeModulesSet = new Set(bundledNativeModules);
    const filteredPeerDependencyIssues = peerDependencyIssues.filter((issue) =>
      bundledNativeModulesSet.has(issue.missingPeerDependency)
    );

    const groupedByMissingPeerDependency = filteredPeerDependencyIssues.reduce(
      (acc, issue) => {
        if (acc[issue.missingPeerDependency]) {
          acc[issue.missingPeerDependency].push(issue.requiredBy);
        } else {
          acc[issue.missingPeerDependency] = [issue.requiredBy];
        }
        return acc;
      },
      {} as Record<string, string[]>
    );

    issues.push(
      ...Object.entries(groupedByMissingPeerDependency).map(
        ([missingPeerDependency, requiredBy]) => {
          return `Missing peer dependency: ${missingPeerDependency}\nRequired by: ${requiredBy.join(', ')}`;
        }
      )
    );

    if (issues.length > 0) {
      const isPlural = Object.keys(groupedByMissingPeerDependency).length > 1;
      advice.push(
        `Install missing required peer ${isPlural ? 'dependencies' : 'dependency'} with "npx expo install ${Object.keys(groupedByMissingPeerDependency).join(' ')}"`
      );
      advice.push(
        `Your app may crash outside of Expo Go without ${isPlural ? 'these dependencies' : 'this dependency'}. Native module peer dependencies must be installed directly.`
      );
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }

  private async checkPackagePeerDependencies(
    packageName: string,
    projectRoot: string,
    installedDependencies: Record<string, string>
  ): Promise<{ missingPeerDependency: string; requiredBy: string }[]> {
    const issues: { missingPeerDependency: string; requiredBy: string }[] = [];

    try {
      const packageJsonPath = path.join(projectRoot, 'node_modules', packageName, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return issues;
      }

      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson: PackageJson = JSON.parse(packageJsonContent);

      if (!packageJson.peerDependencies) {
        return issues;
      }

      await Promise.all(
        Object.keys(packageJson.peerDependencies).map(async (peerDepName) => {
          const isOptional = packageJson.peerDependenciesMeta?.[peerDepName]?.optional;

          if (!isOptional && !installedDependencies[peerDepName]) {
            issues.push({
              missingPeerDependency: peerDepName,
              requiredBy: packageName,
            });
          }
        })
      );
    } catch (error) {
      Log.error(`Warning: Could not read package.json for ${packageName}`);
    }

    return issues;
  }
}
