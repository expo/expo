import spawnAsync, { SpawnResult } from '@expo/spawn-async';
import semver from 'semver';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { parseInstallCheckOutput } from '../utils/parseInstallCheckOutput';

function isSpawnResult(result: any): result is SpawnResult {
  return 'stderr' in result && 'stdout' in result && 'status' in result;
}

export class InstalledDependencyVersionCheck implements DoctorCheck {
  description = 'Check that packages match versions required by installed Expo SDK';

  sdkVersionRange = '>=46.0.0';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    // Expo CLI introduced support for --json output in SDK 54
    // Command: npx expo install --check --json
    // Output format:
    // {
    //   "upToDate": false,
    //   "dependencies": [
    //     {
    //       "packageName": "expo-image",
    //       "packageType": "dependencies",
    //       "expectedVersionOrRange": "~2.2.1",
    //       "actualVersion": "2.2.0",
    //     }
    //   ]
    // }
    const projectMajorSdkVersion = exp.sdkVersion ? semver.major(exp.sdkVersion) : null;

    if (projectMajorSdkVersion && projectMajorSdkVersion >= 54) {
      let commandResult: SpawnResult;

      try {
        commandResult = await spawnAsync('npx', ['expo', 'install', '--check', '--json'], {
          stdio: 'pipe',
          cwd: projectRoot,
          env: { ...process.env, CI: '1' },
        });
      } catch (error: any) {
        if (isSpawnResult(error) && error.status === 1) {
          // Exit code 1 is expected when dependencies are out of date - this is normal behavior
          commandResult = error;
        } else {
          throw error;
        }
      }

      const initialIssuesCount = issues.length;
      parseInstallCheckOutput(commandResult.stdout, issues, projectMajorSdkVersion);

      // Only fall back to stderr if stdout didn't contain valid JSON indicating up-to-date status
      if (issues.length === initialIssuesCount && commandResult.stderr.trim()) {
        // Check if stdout indicates dependencies are up to date
        let isUpToDate = false;
        try {
          const jsonMatch = commandResult.stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const output = JSON.parse(jsonMatch[0]);
            isUpToDate = output.upToDate === true;
          }
        } catch {
          // JSON parsing failed, continue with stderr processing
        }

        // Only process stderr as errors if dependencies are not up to date
        if (!isUpToDate) {
          const stderrLines = commandResult.stderr.split('\n').filter((line) => {
            const trimmedLine = line.trim();
            // Filter out Expo debug logs and timestamps
            return (
              trimmedLine &&
              !trimmedLine.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z expo:/) &&
              !trimmedLine.startsWith('expo:')
            );
          });

          const filteredStderr = stderrLines.join('\n').trim();
          if (filteredStderr) {
            issues.push(filteredStderr);
          }
        }
      }
    } else {
      // SDK versions <54 don't support --json output
      // In the future, we should remove this and use the --json output above
      try {
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
    }

    if (issues.length) {
      advice.push(`Use 'npx expo install --check' to review and upgrade your dependencies.`);
      advice.push(
        `To ignore specific packages, add them to "expo.install.exclude" in package.json. ${learnMore(
          'https://expo.fyi/dependency-validation'
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
