import glob from 'fast-glob';
import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { isFileIgnoredAsync } from '../utils/files';

export class ProjectSetupCheck implements DoctorCheck {
  description = 'Check for common project setup issues';

  sdkVersionRange = '*';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    /* Check that Expo modules native projects aren't getting gitignored.  Skip
     * this check when running on an EAS Build worker, where we may or may not
     * have git. */

    if (fs.existsSync(path.join(projectRoot, 'modules')) && !process.env.EAS_BUILD) {
      // Glob returns matching files and `git check-ignore` checks files, as
      // well, but we want to check if the path is gitignored, so we pick vital
      // files to match off of (e.g., .podspec, build.gradle).
      const keyFilePathsForModules = [
        path.join(projectRoot, 'modules', '**', 'ios', '*.podspec'),
        path.join(projectRoot, 'modules', '**', 'android', 'build.gradle'),
      ];

      if (
        (await Promise.all(keyFilePathsForModules.map(areAnyMatchingPathsIgnoredAsync))).find(
          (result) => result
        )
      ) {
        issues.push(
          'This project contains local Expo modules, but the "android" and "ios" directories inside the modules are gitignored. This is often due to overly general gitignore rules. Use patterns like "/android" and "/ios" in your .gitignore file to exclude only the top-level "android" and "ios" directories.'
        );
      }
    }

    /* Check for multiple lockfiles. */

    const lockfileCheckResults = await Promise.all(
      ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'].map((lockfile) => {
        return { lockfile, exists: fs.existsSync(`${projectRoot}/${lockfile}`) };
      })
    );

    const lockfiles = lockfileCheckResults
      .filter((result) => result.exists)
      .map((result) => result.lockfile);

    if (lockfiles.length > 1) {
      issues.push(
        `Multiple lock files detected (${lockfiles.join(
          ', '
        )}). This may result in unexpected behavior in CI environments, such as EAS Build, which infer the package manager from the lock file.`
      );
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
    };
  }
}

async function areAnyMatchingPathsIgnoredAsync(filePath: string): Promise<boolean> {
  const matchingNativeFiles = await glob(filePath);
  if (!matchingNativeFiles.length) return false;
  // multiple matches may occur if there are multiple modules
  return (
    (
      await Promise.all(matchingNativeFiles.map((filePath) => isFileIgnoredAsync(filePath, true)))
    ).find((result) => result) || false
  );
}
