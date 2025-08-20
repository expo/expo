import chalk from 'chalk';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import {
  getReactNativeDirectoryCheckExcludes,
  getReactNativeDirectoryCheckListUnknownPackagesEnabled,
} from '../utils/doctorConfig';
import { checkLibraries } from '../utils/reactNativeDirectoryApi';

// Filter out common packages that don't make sense for us to validate on the directory.
export const DEFAULT_PACKAGES_TO_IGNORE = [
  'jest',
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  /^babel-.*$/,
  /^@expo\/.*$/,
  /^@expo-google-fonts\/.*$/,
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

export class ReactNativeDirectoryCheck implements DoctorCheck {
  description = 'Validate packages against React Native Directory package metadata';

  sdkVersionRange = '>=51.0.0';

  async runAsync({ pkg }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const newArchUnsupportedPackages: string[] = [];
    const newArchUntestedPackages: string[] = [];
    const unmaintainedPackages: string[] = [];
    const unknownPackages: string[] = [];
    const dependencies = pkg.dependencies ?? {};
    const userDefinedIgnoredPackages = getReactNativeDirectoryCheckExcludes(pkg);
    const listUnknownPackagesEnabled = getReactNativeDirectoryCheckListUnknownPackagesEnabled(pkg);

    const packageNames = filterPackages(Object.keys(dependencies), [
      ...DEFAULT_PACKAGES_TO_IGNORE,
      ...userDefinedIgnoredPackages,
    ]);

    const packageMetadata = await checkLibraries(packageNames);
    if (!packageMetadata) {
      return {
        isSuccessful: false,
        issues: ['Directory check failed with unexpected server response'],
        advice: [],
      };
    }

    packageNames.forEach((packageName) => {
      const metadata = packageMetadata[packageName];
      if (!metadata) {
        unknownPackages.push(packageName);
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

    let hasCriticalIssues = false;

    if (newArchUnsupportedPackages.length > 0) {
      hasCriticalIssues = true;
      issues.push(
        `${chalk.bold(`  Unsupported on New Architecture:`)} ${newArchUnsupportedPackages.join(', ')}`
      );
    }

    if (newArchUntestedPackages.length > 0) {
      hasCriticalIssues = true;
      issues.push(
        `${chalk.bold(`  Untested on New Architecture:`)} ${newArchUntestedPackages.join(', ')}`
      );
    }

    if (unmaintainedPackages.length > 0) {
      hasCriticalIssues = true;
      issues.push(`${chalk.bold(`  Unmaintained:`)} ${unmaintainedPackages.join(', ')}`);
    }

    if (
      (listUnknownPackagesEnabled === null || listUnknownPackagesEnabled) &&
      unknownPackages.length > 0
    ) {
      issues.push(`${chalk.bold(`  No metadata available`)}: ${unknownPackages.join(', ')}`);
    }

    if (!hasCriticalIssues && listUnknownPackagesEnabled === null) {
      // NOTE(@kitten): We shouldn't output just "no metadata available" packages with no other
      // issues, if the user hasn't explicitly opted-in or opted-out, since it adds to the output
      // noise of doctor
      return {
        isSuccessful: true,
        issues: [],
        advice: [],
      };
    }

    if (issues.length) {
      issues.unshift(
        `The following issues were found when validating your dependencies against React Native Directory:`
      );
    }

    const advice = [];

    if (
      unmaintainedPackages.length > 0 ||
      newArchUnsupportedPackages.length > 0 ||
      newArchUntestedPackages.length > 0
    ) {
      advice.push(
        `Use libraries that are actively maintained and support the New Architecture. Find alternative libraries with ${chalk.bold('https://reactnative.directory')}.`
      );
      advice.push(
        `Add packages to ${chalk.bold(
          'expo.doctor.reactNativeDirectoryCheck.exclude'
        )} in package.json to selectively skip validations, if the warning is not relevant.`
      );
    }

    if (unknownPackages.length > 0) {
      advice.push(
        `Update React Native Directory to include metadata for unknown packages. Alternatively, set ${chalk.bold(
          'expo.doctor.reactNativeDirectoryCheck.listUnknownPackages'
        )} in package.json to ${chalk.bold('false')} to skip warnings about packages with no metadata, if the warning is not relevant.`
      );
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length ? advice : [],
    };
  }
}
