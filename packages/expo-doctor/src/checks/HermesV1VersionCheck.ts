import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { loadBabelConfigPlugins } from '../utils/babelConfigLoader';
import { getHermesVersion } from '../utils/hermesVersion';
import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

const FIXED_EXPO_VERSION = '57.0.9';
const AFFECTED_HERMES_VERSION_PREFIX = '250829098.';
const LAST_AFFECTED_HERMES_VERSION = '250829098.0.15';
const FIRST_FIXED_HERMES_VERSION = '250829098.0.16';

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

function isWorkletsBundleModeEnabled(projectRoot: string): boolean {
  const plugins = loadBabelConfigPlugins(projectRoot);
  return !!plugins?.some((plugin) => {
    const request = plugin.file?.request;
    const resolved = plugin.file?.resolved;
    const isWorkletsPlugin =
      request === 'react-native-worklets/plugin' ||
      (typeof resolved === 'string' &&
        /react-native-worklets[\\/]plugin(?:[\\/]|$)/.test(resolved));
    const options = plugin.options;
    return (
      isWorkletsPlugin &&
      typeof options === 'object' &&
      options !== null &&
      'bundleMode' in options &&
      options.bundleMode === true
    );
  });
}

export class HermesV1VersionCheck implements DoctorCheck {
  description = 'Check for Expo SDK versions affected by Hermes V1 regressions';

  sdkVersionRange = '>=55.0.0 <58.0.0';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const expoVersion = getInstalledExpoVersion(projectRoot);
    const hermesVersion = getHermesVersion(projectRoot);
    const isSdk55 = semver.satisfies(exp.sdkVersion!, '>=55.0.0 <56.0.0');
    const usesHermesV1 = isSdk55 ? isHermesV1Enabled(exp) : true;
    const expoVersionMajor = expoVersion ? semver.major(expoVersion) : null;
    const isExpoVersionAffected =
      !!expoVersion &&
      ((expoVersionMajor === 55 && usesHermesV1) ||
        expoVersionMajor === 56 ||
        (expoVersionMajor === 57 && semver.lt(expoVersion, FIXED_EXPO_VERSION)));
    const isHermesVersionAffected =
      usesHermesV1 &&
      !!hermesVersion &&
      hermesVersion.version.startsWith(AFFECTED_HERMES_VERSION_PREFIX) &&
      semver.lte(hermesVersion.version, LAST_AFFECTED_HERMES_VERSION);

    const issues: string[] = [];
    const advice: string[] = [];

    if (isExpoVersionAffected) {
      issues.push(
        `This project uses Hermes V1 with expo@${expoVersion}, which is affected by a known memory regression.`
      );
      advice.push(
        'Upgrade to Expo SDK 57 and expo@57.0.9 or later by running `npx expo install expo@^57.0.9 --fix`. See https://expo.dev/changelog/sdk-57#known-regressions for the latest details.'
      );
    }

    if (isHermesVersionAffected) {
      issues.push(
        `Detected Hermes V1 ${hermesVersion.version} from ${hermesVersion.source === 'react-native' ? 'React Native' : 'hermes-compiler'}. Hermes V1 ${LAST_AFFECTED_HERMES_VERSION} and earlier are affected by this regression; ${FIRST_FIXED_HERMES_VERSION} is the first version that contains the fix.`
      );
      advice.push(
        'Upgrade to React Native 0.86.2 or later, which includes the fixed Hermes version. For Expo projects, install Expo SDK 57 with expo@57.0.9 or later and run `npx expo install --fix` to align React Native and other dependencies.'
      );
    }

    if (issues.length === 0) {
      return { isSuccessful: true, issues: [], advice: [] };
    }

    if (isWorkletsBundleModeEnabled(projectRoot)) {
      advice.push(
        'Worklets Bundle Mode is enabled in your Babel config. It is unsupported and experimental, may not work as expected in many cases, and is not recommended for production use until it is officially supported. If you enabled it only as a workaround for this memory regression, review and remove the Bundle Mode Babel and Metro configuration after upgrading.'
      );
    }

    return {
      isSuccessful: false,
      issues,
      advice,
    };
  }
}
