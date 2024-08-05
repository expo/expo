import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { isFileIgnoredAsync } from '../utils/isFileIgnoredAsync';

export class PossiblyUnintentionallyBareCheck implements DoctorCheck {
  description = 'Check for possibly unintentionally bare projects';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // ** possibly-unintentionally-bare check **

    if (
      exp.plugins?.length &&
      // git check-ignore needs a specific file to check gitignore, we choose Podfile
      ((await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'ios', 'Podfile'))) ||
        (await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'android', 'build.gradle'))))
    ) {
      issues.push(
        'This project has native project folders but also has config plugins, indicating it is configured to use Prebuild. EAS Build will not sync your native configuration if the ios or android folders are present. Add these folders to your .gitignore file if you intend to use prebuild (aka "managed" workflow).'
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
