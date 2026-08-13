import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

const FIXED_EXPO_VERSION = '57.0.9';

function getInstalledExpoVersion(projectRoot: string): string | null {
  const packageJsonPath = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (!packageJsonPath) {
    return null;
  }

  const { version } = JsonFile.read(packageJsonPath, { json5: true });
  return typeof version === 'string' && semver.valid(version) ? version : null;
}

function isHermesV1Enabled(exp: DoctorCheckParams['exp']): boolean {
  const plugin = exp.plugins?.find(
    (plugin): plugin is [string, Record<string, any>] =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
  );
  const props = plugin?.[1];
  if (!props) {
    return false;
  }

  const androidValue = props.android?.useHermesV1 ?? props.useHermesV1 ?? false;
  const iosValue = props.ios?.useHermesV1 ?? props.useHermesV1 ?? false;
  return androidValue === true || iosValue === true;
}

export class HermesV1VersionCheck implements DoctorCheck {
  description = 'Check for Expo SDK versions affected by Hermes V1 regressions';

  sdkVersionRange = '>=55.0.0 <58.0.0';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const expoVersion = getInstalledExpoVersion(projectRoot);
    if (!expoVersion || semver.gte(expoVersion, FIXED_EXPO_VERSION)) {
      return { isSuccessful: true, issues: [], advice: [] };
    }

    const isSdk55 = semver.satisfies(expoVersion, '>=55.0.0 <56.0.0');
    const isAffected = isSdk55
      ? isHermesV1Enabled(exp)
      : semver.satisfies(expoVersion, '>=56.0.0 <57.0.9');

    if (!isAffected) {
      return { isSuccessful: true, issues: [], advice: [] };
    }

    return {
      isSuccessful: false,
      issues: [
        `This project uses Hermes V1 with expo@${expoVersion}, which is affected by a known memory regression.`,
      ],
      advice: [
        'Upgrade to Expo SDK 57 and expo@57.0.9 or later by running `npx expo install expo@^57.0.9 --fix`. See https://expo.dev/changelog/sdk-57#known-regressions for the latest details.',
      ],
    };
  }
}
