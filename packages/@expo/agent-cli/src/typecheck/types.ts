// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the `--json` keys mirror the
// text labels, and they are the stable half of the contract.
//
// What `@expo/agent-cli typecheck` reports: the project's own TypeScript compiler run for its verdict, and
// its diagnostics read back as data.

import type { FollowUp } from '../followups/types';
import type { MissingGeneratedTypes } from './generatedTypes';

/** One diagnostic the compiler reported. */
export interface TypeError {
  /**
   * File the diagnostic is in, as the compiler named it — relative to the project root, because
   * that is where the compiler ran. Null for a diagnostic about the configuration rather than
   * about a file, e.g. `TS18003: No inputs were found in config file …`.
   */
  file: string | null;
  /** 1-based, the way editors count. Null for a diagnostic with no file. */
  line: number | null;
  /** 1-based, the way the compiler prints it. Null for a diagnostic with no file. */
  column: number | null;
  /** The compiler's own code, e.g. `TS2339`. The stable half of a diagnostic. */
  code: string;
  /**
   * What the compiler said, with the continuation lines of a nested explanation joined onto it by
   * newlines. The first line is the diagnostic; the rest is why.
   */
  message: string;
}

/** The whole answer of `typecheck`, minus the follow-ups the command attaches. */
export interface TypeCheckReport {
  projectRoot: string;
  /**
   * Whether a compiler ran at all.
   *
   * `false` is not a failure and is deliberately not one: a project with no TypeScript in it has
   * nothing for this command to check, and a gate that went red on it would be red for every
   * JavaScript project forever. {@link reason} says which of the two ways it did not run.
   */
  checked: boolean;
  /** Why nothing was checked. Present exactly when {@link checked} is false. */
  reason: string | null;
  /** How many diagnostics the compiler reported. `0` for a project that type-checks. */
  errorCount: number;
  /** The diagnostics themselves, in the order the compiler printed them. */
  errors: TypeError[];
  /** How long the compiler took, in milliseconds. `0` when it never ran. */
  durationMs: number;
  /**
   * A generated declaration file the project expects and does not have, or null.
   *
   * Non-null only for a run that *found* diagnostics: the file is what some of them are about, and
   * on a green run its absence has cost nothing and is not worth a line. A brand-new project's
   * first `typecheck` is red for this reason alone (F64), and "fix the diagnostics above" is advice
   * for a problem the caller cannot fix by editing the files named.
   */
  generatedTypes: MissingGeneratedTypes | null;
}

/** What the command prints under `--json`. */
export interface TypeCheckPayload extends TypeCheckReport {
  followups: FollowUp[];
}
