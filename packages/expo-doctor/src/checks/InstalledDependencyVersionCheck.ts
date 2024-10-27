import spawnAsync, { SpawnResult } from '@expo/spawn-async';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

function isSpawnResult(result: any): result is SpawnResult {
  return 'stderr' in result && 'stdout' in result && 'status' in result;
}

export class InstalledDependencyVersionCheck implements DoctorCheck {
  description = 'Check that packages match versions required by installed Expo SDK';

  sdkVersionRange = '>=46.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    try {
      // only way to check dependencies without automatically fixing them is to use interactive prompt
      // In the future, we should add JSON output to npx expo install, check for support, and use that instead
      await spawnAsync('npx', ['expo', 'install', '--check'], {
        stdio: 'pipe',
        cwd: projectRoot,
        env: { ...process.env, CI: '1' },
      });
    } catch (error: any) {
      if (isSpawnResult(error)) {
        issues.push(error.stderr.trim());
      } else {
        throw error;
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice: issues.length
        ? `Use 'npx expo install --check' to review and upgrade your dependencies.`
        : undefined,
    };
  }
}
