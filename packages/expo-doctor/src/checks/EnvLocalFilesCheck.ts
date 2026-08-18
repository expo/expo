import { getEnvFiles, KNOWN_MODES } from '@expo/env';
import fs from 'fs';
import path from 'path';

import { isFileIgnoredAsync } from '../utils/files';
import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class EnvLocalFilesCheck implements DoctorCheck {
  description = 'Check that local environment files are not committed';

  sdkVersionRange = '*';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    const localEnvFiles = Array.from(
      new Set(KNOWN_MODES.flatMap((mode) => getEnvFiles({ mode, silent: true })))
    ).filter((file) => file.endsWith('.local'));

    const committedFiles: string[] = [];
    for (const file of localEnvFiles) {
      const filePath = path.join(projectRoot, file);
      if (!fs.existsSync(filePath)) continue;
      const isIgnored = await isFileIgnoredAsync(filePath, false);
      // NOTE: skip if the ignore-status is undetermined (e.g. repo isn't a git
      // checkout) to avoid false-positives, matching ProjectSetupCheck's pattern
      if (isIgnored === false) {
        committedFiles.push(file);
      }
    }

    if (committedFiles.length > 0) {
      issues.push(
        `The following local environment file(s) exist in the project but are not ignored by Git: ${committedFiles.join(', ')}. Files matching ".env*.local" are intended as per-developer overrides — committing them risks leaking secrets, overriding secure defaults loaded from your committed ".env" files, or imposing your personal SDK paths on others who clone the project.`
      );
      advice.push(
        `Add ".env*.local" to your .gitignore. If any of these files have already been committed, untrack them with "git rm --cached ${committedFiles.join(' ')}" and commit the change.`
      );
    }

    return { isSuccessful: issues.length === 0, issues, advice };
  }
}
