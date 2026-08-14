import semver from 'semver';

import type { SdkCompatibilityData } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireString = (
  value: unknown,
  path: string,
  errors: string[],
  options: { semver?: boolean; semverRange?: boolean } = {}
) => {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${path} must be a non-empty string.`);
    return;
  }
  if (options.semver && !semver.valid(value)) {
    errors.push(`${path} must be a valid semantic version.`);
  }
  if (options.semverRange && !semver.validRange(value)) {
    errors.push(`${path} must be a valid semantic version range.`);
  }
};

const requireNumber = (value: unknown, path: string, errors: string[]) => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer.`);
  }
};

export function validateSdkCompatibilityData(value: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ['Compatibility data must be an object.'];
  }
  if (value.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1.');
  }
  if (!Array.isArray(value.sdkVersions)) {
    errors.push('sdkVersions must be an array.');
    return errors;
  }

  const seenSdkMajors = new Set<number>();
  let previousSdkMajor = Number.POSITIVE_INFINITY;

  value.sdkVersions.forEach((entry, index) => {
    const path = `sdkVersions[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${path} must be an object.`);
      return;
    }

    requireString(entry.sdk, `${path}.sdk`, errors, { semver: true });
    const sdkMajor =
      typeof entry.sdk === 'string' && semver.valid(entry.sdk) ? semver.major(entry.sdk) : null;
    if (sdkMajor !== null) {
      if (seenSdkMajors.has(sdkMajor)) {
        errors.push(`${path}.sdk duplicates SDK major ${sdkMajor}.`);
      }
      if (sdkMajor >= previousSdkMajor) {
        errors.push('sdkVersions must be ordered from newest to oldest SDK.');
      }
      seenSdkMajors.add(sdkMajor);
      previousSdkMajor = sdkMajor;
    }

    if (!isRecord(entry.android)) {
      errors.push(`${path}.android must be an object.`);
    } else {
      requireNumber(entry.android.minimumVersion, `${path}.android.minimumVersion`, errors);
      requireNumber(entry.android.compileSdkVersion, `${path}.android.compileSdkVersion`, errors);
      if (entry.android.targetSdkVersion !== undefined) {
        requireNumber(entry.android.targetSdkVersion, `${path}.android.targetSdkVersion`, errors);
      }
      if (entry.android.buildToolsVersion !== undefined) {
        requireString(
          entry.android.buildToolsVersion,
          `${path}.android.buildToolsVersion`,
          errors,
          { semver: true }
        );
      }
    }

    if (!isRecord(entry.ios)) {
      errors.push(`${path}.ios must be an object.`);
    } else {
      requireString(entry.ios.minimumVersion, `${path}.ios.minimumVersion`, errors);
      requireString(entry.ios.xcodeVersionRange, `${path}.ios.xcodeVersionRange`, errors, {
        semverRange: true,
      });
      if (entry.ios.xcodeVersionCheckRange !== undefined) {
        requireString(
          entry.ios.xcodeVersionCheckRange,
          `${path}.ios.xcodeVersionCheckRange`,
          errors,
          { semverRange: true }
        );
      }
    }

    if (!isRecord(entry.runtime)) {
      errors.push(`${path}.runtime must be an object.`);
    } else {
      requireString(entry.runtime.reactNative, `${path}.runtime.reactNative`, errors);
      requireString(entry.runtime.reactNativeWeb, `${path}.runtime.reactNativeWeb`, errors);
      if (entry.runtime.reactNativeTvos !== undefined) {
        requireString(entry.runtime.reactNativeTvos, `${path}.runtime.reactNativeTvos`, errors);
      }
      if (entry.runtime.react !== undefined) {
        requireString(entry.runtime.react, `${path}.runtime.react`, errors, { semver: true });
      }
    }

    if (entry.node !== undefined) {
      if (!isRecord(entry.node)) {
        errors.push(`${path}.node must be an object.`);
      } else {
        requireString(entry.node.minimumVersion, `${path}.node.minimumVersion`, errors, {
          semver: true,
        });
      }
    }
  });

  return errors;
}

export function assertSdkCompatibilityData(value: unknown): asserts value is SdkCompatibilityData {
  const errors = validateSdkCompatibilityData(value);
  if (errors.length > 0) {
    throw new Error(`Invalid Expo SDK compatibility data:\n- ${errors.join('\n- ')}`);
  }
}
