import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class ProjectSetupCheck implements DoctorCheck {
  description = 'Check for common project setup issues';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // ** possibly-unintentionally-bare check **

    if (
      exp.plugins?.length &&
      // git check-ignore needs a specific file to check gitignore, we choose Podfile
      ((await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'ios', 'Podfile'))) ||
        (await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'android', 'Podfile'))))
    ) {
      issues.push(
        'This project has native project folders but is also configured to use Prebuild. EAS Build will not sync your native configuration if the ios or android folders are present. Add these folders to your .gitignore file if you intend to use prebuild (aka "managed" workflow).'
      );
    }

    // ** multiple lock file check **

    const lockfileCheckResults = await Promise.all(
      ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'].map(lockfile => {
        return { lockfile, exists: fs.existsSync(`${projectRoot}/${lockfile}`) };
      })
    );

    const lockfiles = lockfileCheckResults
      .filter(result => result.exists)
      .map(result => result.lockfile);

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
