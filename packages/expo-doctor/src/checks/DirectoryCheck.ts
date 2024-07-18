import fetch from 'node-fetch';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class DirectoryCheck implements DoctorCheck {
  description = 'Validate packages against React Native Directory package metadata';

  sdkVersionRange = '>=51.0.0';

  async runAsync({ pkg }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const newArchUnsupportedPackages: string[] = [];
    const newArchUntestedPackages: string[] = [];
    const unmaintainedPackages: string[] = [];

    const dependencies = pkg.dependencies ?? {};
    const packageNames = Object.keys(dependencies);

    try {
      const response = await fetch('https://reactnative.directory/api/libraries/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packages: packageNames }),
      });

      const packageMetadata = await response.json();

      packageNames.forEach((packageName) => {
        const metadata = packageMetadata[packageName];
        if (!metadata) {
          return;
        }

        if (metadata.unmaintained) {
          unmaintainedPackages.push(packageName);
        }

        if (metadata.newArchitecture === 'untested') {
          newArchUntestedPackages.push(packageName);
        }

        if (metadata.newArchitecture === 'unsupported') {
          newArchUnsupportedPackages.push(packageName);
        }
      });
    } catch (error) {
      return {
        isSuccessful: false,
        issues: [`Directory check failed with error: ${error}`],
        advice: undefined,
      };
    }

    if (newArchUnsupportedPackages.length > 0) {
      issues.push(
        `${newArchUnsupportedPackages.join(', ')} ${newArchUnsupportedPackages.length > 1 ? 'are' : 'is'} not supported on the New Architecture.`
      );
    }

    if (newArchUntestedPackages.length > 0) {
      issues.push(
        `${newArchUntestedPackages.join(', ')} ${newArchUntestedPackages.length > 1 ? 'are' : 'is'} not tested on the New Architecture.`
      );
    }

    if (unmaintainedPackages.length > 0) {
      issues.push(
        `${unmaintainedPackages.join(', ')} ${unmaintainedPackages.length > 1 ? 'are' : 'is'} unmaintained.`
      );
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? `Use libraries that are actively maintained and support the New Architecture. Find alternatives at https://reactnative.directory`
        : undefined,
    };
  }
}
