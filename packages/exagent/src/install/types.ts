// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// What `exagent install --json` prints. The top-level keys are the de-facto version of this
// command, so they never depend on which way the install went: a caller that reads `checkpoint`
// after a run that made none gets `null`, not a missing key.

import type { FollowUp } from '../followups/types';
import type { InstallImpactReport } from '../project/types';

/** The one JSON object `exagent install --json` prints on stdout. */
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
  /**
   * The snapshot taken before the install, or null when none was made — the project is not in
   * git, `--no-checkpoint` was passed, or this was a `--check` run that changes nothing.
   */
  checkpoint: { id: string; files: number } | null;
  /** Which of the installed packages ship an agent skill, by package name. */
  skillPackages: string[];
  /**
   * The `expo install --check --json` payload, verbatim, or null when this was not a `--check`
   * run. That report belongs to the Expo CLI and is passed through rather than restated.
   */
  check: unknown;
  followups: FollowUp[];
}
