import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

interface PackageJson {
  name: string;
  version: string;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

export class PeerDependencyChecks implements DoctorCheck {
  description = 'Check that required peer dependencies are installed';

  sdkVersionRange = '*';

  async runAsync({ pkg, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    // Get all dependencies (including devDependencies)
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

    // Check each dependency for missing peer dependencies
    for (const [packageName, packageVersion] of Object.entries(allDependencies)) {
      const peerDependencyIssues = await this.checkPackagePeerDependencies(
        packageName,
        String(packageVersion),
        projectRoot,
        allDependencies
      );
      issues.push(...peerDependencyIssues);
    }

    if (issues.length > 0) {
      advice.push(
        'Install missing required peer dependencies using your package manager (npm install, yarn add, or pnpm add). Note: This check only verifies installation, not version compatibility.'
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
    packageVersion: string,
    projectRoot: string,
    installedDependencies: Record<string, string>
  ): Promise<string[]> {
    const issues: string[] = [];

    try {
      // Read the package.json of the dependency
      const packageJsonPath = path.join(projectRoot, 'node_modules', packageName, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        // Package might not be installed or might be a workspace package
        return issues;
      }

      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson: PackageJson = JSON.parse(packageJsonContent);

      if (!packageJson.peerDependencies) {
        return issues;
      }

      // Check each peer dependency
      for (const [peerDepName, peerDepVersion] of Object.entries(packageJson.peerDependencies)) {
        const isOptional = packageJson.peerDependenciesMeta?.[peerDepName]?.optional;

        // Skip optional peer dependencies
        if (isOptional) {
          continue;
        }

        // Check if the required peer dependency is installed
        if (!installedDependencies[peerDepName]) {
          issues.push(
            `Required peer dependency "${peerDepName}@${peerDepVersion}" for "${packageName}" is not installed.`
          );
        }
        // Note: We only check if the peer dependency is installed, not version compatibility
      }
    } catch (error) {
      // If we can't read the package.json, skip this package
      console.warn(`Warning: Could not read package.json for ${packageName}:`, error);
    }

    return issues;
  }
}
