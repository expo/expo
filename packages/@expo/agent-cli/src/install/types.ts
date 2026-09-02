// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// What `@expo/agent-cli install --json` prints. The top-level keys are the de-facto version of this
// command, so they never depend on which way the install went: a caller that reads `impact` after
// a run that classified nothing gets `[]`, not a missing key.

import type { FollowUp } from '../followups/types';
import type { InstallImpactReport } from '../project/types';
import type { InstallCheckReport } from './checkReport';

/** The one JSON object `@expo/agent-cli install --json` prints on stdout. */
export interface InstallReport {
  projectRoot: string;
  /** Package specs named on the command line, e.g. `['expo-clipboard']`. */
  packages: string[];
  /** Whether `expo install` finished successfully. */
  installed: boolean;
  /** The exit code of the `expo install` subprocess, forwarded as this command's own. */
  exitCode: number;
  /**
   * What each named package changed, and what has to rerun because of it.
   *
   * Empty for a run that installed nothing by name (`--fix`, a bare install) or that was asked
   * not to classify (`--no-impact`), which is the same list the human output prints.
   */
  impact: InstallImpactReport[];
  /** Which of the installed packages ship an agent skill, by package name. */
  skillPackages: string[];
  /**
   * What `--check` found, or null when this was not a `--check` run.
   *
   * A report of this CLI's own with the Expo CLI's payload inside it, because passing that payload
   * through verbatim made "the CLI printed no report" and "this was not a `--check` run" the same
   * `null` — and the first of those is exactly what happens when the check fails hardest. See
   * `./checkReport.ts`.
   */
  check: InstallCheckReport | null;
  followups: FollowUp[];
}
