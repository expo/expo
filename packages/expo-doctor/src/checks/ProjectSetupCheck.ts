import fs from 'fs';
import path from 'path';

import { isFileIgnoredAsync } from '../utils/files';
import { findModuleFilesAsync } from '../utils/findModuleFiles';
import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

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
      const moduleFiles = await findModuleFilesAsync(projectRoot);
      if (
        (await Promise.all(moduleFiles.map((file) => isFileIgnoredAsync(file, true)))).some(Boolean)
      ) {
        issues.push(
          `The "android" and/or "ios" directories (./modules/your-module/[android|ios]) for local Expo modules are gitignored, and they should not be. This is often due to overly general gitignore rules.`
        );
        advice.push(
          `Use patterns like "/android" and "/ios" in your .gitignore file to exclude only the top-level "android" and "ios" directories, and not those in the modules directory.`
        );
      }
    }

    // Check that the .expo directory IS gitignored
    const expoDir = path.join(projectRoot, '.expo');
    if (fs.existsSync(expoDir)) {
      const isIgnored = await isFileIgnoredAsync(expoDir, false);
      // NOTE: If `isIgnored` is `null`, its status is undetermined. For `.expo/` specifically, we skip the issue
      // if the ignore-status is undetermined to avoid false-positives
      if (isIgnored === false) {
        issues.push(
          `The .expo directory is not ignored by Git. It contains machine-specific device history and development server settings and should not be committed.`
        );
        advice.push(`Add ".expo/" to your .gitignore to avoid committing local Expo state.`);
      }
    }

    return { isSuccessful: issues.length === 0, issues, advice };
  }
}
