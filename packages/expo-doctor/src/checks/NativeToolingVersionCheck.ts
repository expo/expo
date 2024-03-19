import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

async function checkCocoapodsVersionAsync(): Promise<string | null> {
  if (process.platform !== 'darwin') {
    return null;
  }
  try {
    const cocoapodsVersionResponse = await spawnAsync('pod', ['--version']);
    const cocoapodsVersion = cocoapodsVersionResponse.stdout.trim();
    if (semver.satisfies(cocoapodsVersion, '1.15.0 || 1.15.1')) {
      return `You are using Cocoapods version ${cocoapodsVersion}. There are known issues with this version and React Native projects. Upgrading to 1.15.2 or higher is recommended.`;
    } else if (semver.validRange(cocoapodsVersion) === null) {
      // the command works and does not fail but somehow doesn't report a valid version (is this possible?)
      return `Cannot determine Cocoapods version. There may be an issue with your Cocoapods installation.`;
    }
  } catch {
    // no install detected / command failed
    return `Cocoapods version check failed. Cocoapods may not be installed or there may be an issue with your Cocoapods installation. Installing version 1.15.2 or higher is recommended.`;
  }
  return null;
}

export class NativeToolingVersionCheck implements DoctorCheck {
  description = 'Check native tooling versions';

  sdkVersionRange = '*';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    const hasPodfile = fs.existsSync(path.join(projectRoot, 'ios', 'Podfile'));

    if (hasPodfile) {
      const checkResult = await checkCocoapodsVersionAsync();
      if (checkResult) {
        issues.push(checkResult);
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      // advice currently tightly coupled with issues in code copied from doctor
    };
  }
}
