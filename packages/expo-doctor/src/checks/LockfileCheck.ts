import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class LockfileCheck implements DoctorCheck {
  description = 'Check for lock file';

  sdkVersionRange = '*';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    const workspaceRoot = await spawnAsync('npm', ['root'], {
      stdio: 'pipe',
      cwd: projectRoot,
    })
      .then(({ stdout }) => path.dirname(stdout))
      .catch(() => {
        // Fall back to project root if `npm root` fails.
        return projectRoot;
      });

    const lockfileCheckResults = [
      'pnpm-lock.yaml',
      'yarn.lock',
      'package-lock.json',
      'bun.lockb',
      'bun.lock',
    ].map((lockfile) => ({
      lockfile,
      exists: fs.existsSync(`${workspaceRoot}/${lockfile}`),
    }));

    const pnpmWorkspaceRoot = await spawnAsync('pnpm', ['root', '-w'], {
      stdio: 'pipe',
      cwd: projectRoot,
    })
      .then(({ stdout }) => path.dirname(stdout))
      .catch(() => null);

    if (pnpmWorkspaceRoot && path.relative(pnpmWorkspaceRoot, workspaceRoot) !== '') {
      lockfileCheckResults.push({
        lockfile: 'pnpm-lock.yaml',
        exists: fs.existsSync(`${pnpmWorkspaceRoot}/pnpm-lock.yaml`),
      });
    }

    const lockfiles = lockfileCheckResults
      .filter((result) => result.exists)
      .map((result) => result.lockfile);

    if (lockfiles.length === 0) {
      issues.push(`No lock file detected.`);
      advice.push(
        `Install dependencies using the package manager of your choice to a generate a lock file.`
      );
    }

    if (lockfiles.length > 1) {
      issues.push(
        `Multiple lock files detected (${lockfiles.join(
          ', '
        )}). This may result in unexpected behavior in CI environments, such as EAS Build, which infer the package manager from the lock file.`
      );
      advice.push(`Remove any lock files for package managers you are not using.`);
    }

    return { isSuccessful: issues.length === 0, issues, advice };
  }
}
