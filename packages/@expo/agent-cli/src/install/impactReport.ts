// @ref llp/0004-smart-start-and-project-state.rfc.md §Sub-features
import chalk from 'chalk';

import * as Log from '../log';
import { classifyInstallImpactAsync } from '../project/impact';
import type { InstallImpact, InstallImpactReport } from '../project/types';
import { event } from './events';

/** What the impact means for the native surface. */
const IMPACT_LABELS: Record<InstallImpact, string> = {
  'js-only': 'JavaScript only',
  'native-module': 'native module',
  'config-plugin': 'config plugin',
};

/** What has to rerun, in the words of the commands that do it. */
const ACTION_LABELS: Record<InstallImpactReport['action'], string> = {
  none: 'nothing has to rerun',
  reload: 'reload the app, the native runtime is unchanged',
  'prebuild-and-build': 'run npx expo prebuild, then build and install the app again',
  'native-sync': 'run pod install / gradle sync, then build and install the app again',
};

/**
 * Print what the packages just installed changed, and emit the same answer as an event.
 *
 * Best-effort: an install that succeeded must not fail because its impact could not be
 * classified, so nothing here throws and the exit code is untouched.
 *
 * @param silent The caller owns stdout, e.g. it prints one JSON object (`--json`), so the lines
 * are left out. The event and the returned classifications are unchanged — the report travels in
 * that object instead.
 * @returns the classifications, which the follow-up builder reads (llp/0009), or an empty list
 * when there was nothing to classify or the classification failed.
 */
export async function reportInstallImpactAsync(
  projectRoot: string,
  packageNames: string[],
  { silent }: { silent?: boolean } = {}
): Promise<InstallImpactReport[]> {
  try {
    const reports = await classifyInstallImpactAsync(projectRoot, packageNames);
    if (!reports.length) {
      return [];
    }

    // Agents read the event; the printed lines are for the developer watching the install.
    event('impact', { packages: packageNames, reports });

    if (silent) {
      return reports;
    }

    Log.log(chalk.bold('Install impact:'));
    for (const report of reports) {
      const reasons = report.reasons.length ? chalk.dim(` (${report.reasons.join(', ')})`) : '';
      Log.log(
        `  ${chalk.bold(report.packageName)} — ${IMPACT_LABELS[report.impact]}: ${
          ACTION_LABELS[report.action]
        }${reasons}`
      );
    }
    return reports;
  } catch (error: any) {
    if (!silent) {
      Log.warn(`Skipping the install impact report: ${error.message}`);
    }
    return [];
  }
}
