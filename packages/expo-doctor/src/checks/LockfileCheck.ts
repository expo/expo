import fs from 'fs';
import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class LockfileCheck implements DoctorCheck {
  description = 'Check for lock file';

  sdkVersionRange = '*';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    const lockfileCheckResults = await Promise.all(
      ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lockb', 'bun.lock'].map(
        (lockfile) => {
          return { lockfile, exists: fs.existsSync(`${projectRoot}/${lockfile}`) };
        }
      )
    );

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
