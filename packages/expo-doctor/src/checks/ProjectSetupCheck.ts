import fs from 'fs';
import { glob, GlobOptions } from 'glob';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { isFileIgnoredAsync } from '../utils/files';

export class ProjectSetupCheck implements DoctorCheck {
  description = 'Check for common project setup issues';

  sdkVersionRange = '*';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    /* Check that Expo modules native projects aren't getting gitignored.  Skip
     * this check when running on an EAS Build worker, where we may or may not
     * have git. */

    if (fs.existsSync(path.join(projectRoot, 'modules'))) {
      // Glob returns matching files and `git check-ignore` checks files, as
      // well, but we want to check if the path is gitignored, so we pick vital
      // files to match off of (e.g., .podspec, build.gradle).
      const keyFilePathsForModules: readonly ({ pattern: string } & GlobOptions)[] = [
        { pattern: 'modules/**/ios/*.podspec', cwd: projectRoot, absolute: true },
        { pattern: 'modules/**/android/build.gradle', cwd: projectRoot, absolute: true },
      ];

      if (
        (await Promise.all(keyFilePathsForModules.map(areAnyMatchingPathsIgnoredAsync))).find(
          (result) => result
        )
      ) {
        issues.push(
          `The "android" and/or "ios" directories (./modules/your-module/[android|ios]) for local Expo modules are gitignored, and they should not be. This is often due to overly general gitignore rules.`
        );
        advice.push(
          `Use patterns like "/android" and "/ios" in your .gitignore file to exclude only the top-level "android" and "ios" directories, and not those in the modules directory.`
        );
      }
    }

    return { isSuccessful: issues.length === 0, issues, advice };
  }
}

async function areAnyMatchingPathsIgnoredAsync({
  pattern,
  ...options
}: { pattern: string } & GlobOptions): Promise<boolean> {
  const matchingNativeFiles = await glob(pattern, { ...options, withFileTypes: false });
  if (!matchingNativeFiles.length) return false;
  // multiple matches may occur if there are multiple modules
  return (
    (
      await Promise.all(matchingNativeFiles.map((filePath) => isFileIgnoredAsync(filePath, true)))
    ).find((result) => result) || false
  );
}
