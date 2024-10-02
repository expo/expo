import glob from 'fast-glob';
import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { isFileIgnoredAsync } from '../utils/files';

export class ProjectSetupCheck implements DoctorCheck {
  description = 'Check for common project setup issues';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // ** check that expo modules native projects aren't getting gitignored **

    if (fs.existsSync(path.join(projectRoot, 'modules'))) {
      // Glob returns matching files and `git check-ignore` checks files, as well, but we want to check if the path is gitignored,
      // so we pick vital files to match off of (e.g., .podspec, build.gradle).
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
          'This project contains local Expo modules, but the android/ios folders inside the modules are gitignored. These files are required to build your native module into your app. Use patterns like "/android" and "/ios" in your .gitignore file to exclude only the top-level android and ios folders.'
        );
      }
    }

    // ** multiple lock file check **

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
        `This project has multiple package manager lock files (${lockfiles.join(
          ', '
        )}). This may cause EAS build to restore dependencies with a different package manager from what you use in other environments.`
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
