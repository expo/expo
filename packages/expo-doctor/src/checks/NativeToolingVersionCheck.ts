import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { getXcodeVersionAsync } from '../utils/getXcodeVersionAsync';

async function checkCocoapodsVersionAsync(): Promise<string | null> {
  if (process.platform !== 'darwin') {
    return null;
  }
  try {
    const cocoapodsVersionResponse = await spawnAsync('pod', ['--version']);
    const cocoapodsVersion = cocoapodsVersionResponse.stdout.trim();
    if (semver.satisfies(cocoapodsVersion, '1.15.0 || 1.15.1')) {
      return `You are using CocoaPods version ${cocoapodsVersion}. There are known issues with this version and React Native projects. Upgrading to 1.15.2 or higher is recommended.`;
    } else if (semver.validRange(cocoapodsVersion) === null) {
      // the command works and does not fail but somehow doesn't report a valid version (is this possible?)
      return `Cannot determine CocoaPods version. There may be an issue with your CocoaPods installation.`;
    }
  } catch {
    // no install detected / command failed
    return `CocoaPods version check failed. CocoaPods may not be installed or there may be an issue with your CocoaPods installation. Installing version 1.15.2 or higher is recommended.`;
  }
  return null;
}

async function checkMinimumXcodeVersionAsync(
  sdkVersion: string | undefined
): Promise<string | null> {
  const { xcodeVersion } = await getXcodeVersionAsync();

  if (!xcodeVersion || !sdkVersion) {
    return null;
  }

  // Table of SDK version compatibility with Xcode versions
  const compatibilityTable: Record<string, string> = {
    '51': '<=16.2.0',
  };

  const majorSdkVersion = semver.major(sdkVersion).toString();

  if (compatibilityTable[majorSdkVersion]) {
    const requiredXcodeVersion = compatibilityTable[majorSdkVersion];

    if (!semver.satisfies(xcodeVersion, requiredXcodeVersion)) {
      return `Your Expo SDK version ${majorSdkVersion} is not compatible with Xcode ${xcodeVersion}. Required Xcode version: ${requiredXcodeVersion}.`;
    }
  }

  return null;
}

export class NativeToolingVersionCheck implements DoctorCheck {
  description = 'Check native tooling versions';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    const hasPodfile = fs.existsSync(path.join(projectRoot, 'ios', 'Podfile'));

    if (hasPodfile) {
      const checkResult = await checkCocoapodsVersionAsync();
      if (checkResult) {
        issues.push(checkResult);
        advice.push(`Update your native tooling to the recommended versions.`);
      }
    }

    const checkResult = await checkMinimumXcodeVersionAsync(exp.sdkVersion);
    if (checkResult) {
      issues.push(checkResult);
      advice.push(
        `Use a compatible Xcode version for your SDK version. ${learnMore(
          'https://expo.fyi/expo-sdk-xcode-compatibility'
        )}`
      );
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}
