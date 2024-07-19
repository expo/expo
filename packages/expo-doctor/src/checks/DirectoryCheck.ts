import chalk from 'chalk';
import fetch from 'node-fetch';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getDirectoryCheckExcludes } from '../utils/doctorConfig';

// Filter out common packages that don't make sense for us to validate on the directory.
const DEFAULT_PACKAGES_TO_IGNORE = [
  'react-native',
  'react',
  'react-dom',
  'react-native-web',
  'jest',
  /^babel-.*$/,
  /^@types\/.*$/,
];

export function filterPackages(packages: string[], ignoredPackages: (RegExp | string)[]) {
  return packages.filter((packageName) => {
    return ignoredPackages.every((ignoredPackage) => {
      if (ignoredPackage instanceof RegExp) {
        return !ignoredPackage.test(packageName);
      }
      return ignoredPackage !== packageName;
    });
  });
}

export class DirectoryCheck implements DoctorCheck {
  description = 'Validate packages against React Native Directory package metadata';

  sdkVersionRange = '>=51.0.0';

  async runAsync({ pkg }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const newArchUnsupportedPackages: string[] = [];
    const newArchUntestedPackages: string[] = [];
    const unmaintainedPackages: string[] = [];
    const unvalidatedPackages: string[] = [];
    const dependencies = pkg.dependencies ?? {};
    const userDefinedIgnoredPackages = getDirectoryCheckExcludes(pkg);
    const packageNames = filterPackages(Object.keys(dependencies), [
      ...DEFAULT_PACKAGES_TO_IGNORE,
      ...userDefinedIgnoredPackages,
    ]);

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
          unvalidatedPackages.push(packageName);
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
        `- ${newArchUnsupportedPackages.join(', ')} ${newArchUnsupportedPackages.length > 1 ? 'are' : 'is'} not supported on the New Architecture.`
      );
    }

    if (newArchUntestedPackages.length > 0) {
      issues.push(
        `- ${newArchUntestedPackages.join(', ')} ${newArchUntestedPackages.length > 1 ? 'are' : 'is'} not tested on the New Architecture.`
      );
    }

    if (unmaintainedPackages.length > 0) {
      issues.push(
        `- ${unmaintainedPackages.join(', ')} ${unmaintainedPackages.length > 1 ? 'are' : 'is'} unmaintained.`
      );
    }

    const isSuccessful = issues.length === 0;

    if (unvalidatedPackages.length > 0) {
      issues.push(
        `- ${unvalidatedPackages.join(', ')} ${unvalidatedPackages.length > 1 ? 'were' : 'was'} not validated because ${unvalidatedPackages.length > 1 ? 'they are' : 'it is'} not tracked by React Native Directory. You can explicitly skip validating these packages by adding them to ${chalk.bold('expo.doctor.directoryCheck.exclude')} in your package.json.`
      );
    }

    return {
      isSuccessful,
      issues,
      advice: issues.length
        ? `Use libraries that are actively maintained and support the New Architecture. Find alternatives at https://reactnative.directory`
        : undefined,
    };
  }
}
