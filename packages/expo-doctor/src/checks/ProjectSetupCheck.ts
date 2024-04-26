import spawnAsync from '@expo/spawn-async';
import glob from 'fast-glob';
import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class ProjectSetupCheck implements DoctorCheck {
  description = 'Check for common project setup issues';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // ** check that expo modules native projects aren't getting gitignored **

    if (fs.existsSync(path.join(projectRoot, 'modules'))) {
      const keyFilePathsForModules = [
        path.join(projectRoot, 'modules', '**', 'ios', '*.podspec'),
        path.join(projectRoot, 'modules', '**', 'android', 'build.gradle'),
      ];

      if (
        (await Promise.all(keyFilePathsForModules.map(isPathIgnoredAsync))).find((result) => result)
      ) {
        issues.push(
          'This project contains local Expo modules, but the android/ios folders inside the modules are gitignored. These files are required to build your native module into your app. Use patterns like "/android" and "/ios" in your .gitignore file to exclude only the top-level android and ios folders.'
        );
      }
    }

    // ** possibly-unintentionally-bare check **

    if (
      exp.plugins?.length &&
      // git check-ignore needs a specific file to check gitignore, we choose Podfile
      ((await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'ios', 'Podfile'))) ||
        (await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'android', 'Podfile'))))
    ) {
      issues.push(
        'This project has native project folders but also has config plugins, indicating it is configured to use Prebuild. EAS Build will not sync your native configuration if the ios or android folders are present. Add these folders to your .gitignore file if you intend to use prebuild (aka "managed" workflow).'
      );
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

async function existsAndIsNotIgnoredAsync(filePath: string): Promise<boolean> {
  return fs.existsSync(filePath) && !(await isFileIgnoredAsync(filePath));
}

async function isFileIgnoredAsync(filePath: string): Promise<boolean> {
  try {
    await spawnAsync('git', ['check-ignore', '-q', filePath], {
      cwd: path.normalize(await getRootPathAsync()),
    });
    return true;
  } catch {
    return false;
  }
}

async function getRootPathAsync(): Promise<string> {
  return (await spawnAsync('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
}

/**
 * Glob returns matching files and `git check-ignore` checks files, as well, but we want to check if the path is gitignored,
 * so we pick vital files to match off of (e.g., .podspec, build.gradle).
 */
async function isPathIgnoredAsync(filePath: string): Promise<boolean> {
  const matchingNativeFiles = await glob(filePath);
  if (!matchingNativeFiles.length) return false;
  return await isFileIgnoredAsync(matchingNativeFiles[0]);
}
