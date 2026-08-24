// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The shape of the status report: one object with a section per question the command answers.
// Pure data, so the human formatter and the `--json` output describe exactly the same facts.

import type { NativePlatform } from '../plan/types';
import type { PlanStep, ProjectState, ProjectTarget } from '../project/types';
import type { DevServerSource } from '../runtime/devServer';

/** Whether the installed development build can be proven to match the project. */
export type FreshnessState =
  /** The recorded build was made from the current fingerprint. */
  | 'fresh'
  /** Nothing recorded, or recorded from another fingerprint. */
  | 'stale'
  /** No fingerprint to compare, so freshness cannot be decided either way. */
  | 'unknown';

export interface ProjectStatus {
  root: string;
  /** `name` from the project `package.json`, or the directory name. */
  name: string | null;
  /**
   * The version of the **installed `expo` package**, e.g. `57.0.15`. Null when it is unresolvable.
   *
   * The code that is actually on disk, not the SDK line the app config names. `config:effective`
   * reports that one, and it reports it as `configuredSdkVersion` for exactly this reason:
   * `57.0.15` and `57.0.0` are two answers to two questions, and one field name for both read as
   * a disagreement between the commands.
   */
  sdkVersion: string | null;
  /** `bare` when a native directory is checked in, `cng` when prebuild generates it. */
  native: 'bare' | 'cng';
  nativeDirs: { ios: boolean; android: boolean };
  usesDevClient: boolean;
  hasWeb: boolean;
}

export interface ExpoGoStatus {
  compatible: boolean;
  /** How many reasons block Expo Go. The reasons themselves are in {@link StatusReport.probe}. */
  reasonCount: number;
}

export interface PlatformFreshness {
  platform: NativePlatform;
  state: FreshnessState;
  /** Short phrase explaining the state, e.g. "no recorded build". */
  detail: string;
  /** Fingerprint of the last build `exagent` recorded for the platform. */
  recordedHash: string | null;
}

export interface FreshnessStatus {
  /** Current fingerprint of the native surface, or null when the tool is unavailable. */
  hash: string | null;
  /** Why the fingerprint is unavailable. */
  error?: string;
  platforms: PlatformFreshness[];
}

export interface DevServerStatus {
  /** The dev server that was probed, default or `--dev-server-url`. */
  url: string;
  running: boolean;
  /** Debugger targets the dev server reported, i.e. apps connected to it. */
  appsConnected: number;
  /** Which step of discovery produced {@link url}, e.g. the project's lock or a port scan. */
  source: DevServerSource;
  /**
   * Whether the bundler has finished, per `GET /status`.
   *
   * Null when it could not be decided in the moment status allows itself: nothing answered, or
   * the dev server was still bundling when the short probe expired. Status reports where the
   * project is *now* and never waits, so "still working" is reported as unknown rather than as
   * not ready — `npx exagent dev:wait` is the command that waits for the answer.
   */
  ready: boolean | null;
  /**
   * Whether the dev server that answered serves this project, per its own project-root header.
   *
   * Null when it cannot be decided; `false` means another project's dev server answered on the
   * port this one was looked for on.
   */
  projectRootMatched: boolean | null;
  /** Why the dev server did not answer. */
  reason?: string;
}

export interface SkillsStatus {
  /** Agents selected by a previous `exagent skills` run, or null when none is cached. */
  agentIds: string[] | null;
  /** Skills the project's dependencies ship. */
  discovered: number;
  /** Discovered skills linked into every selected agent directory. */
  linked: number;
}

/**
 * Who the Expo CLI family acts as on this machine.
 *
 * Answers before a long command starts what would otherwise be found out after it: an agent that
 * reads `loggedIn: false` here knows to hand a login to its user rather than to begin a deploy
 * that will stop on one (llp/0010 §Needs-human protocol).
 */
export interface AuthStatus {
  /** Null when nothing could answer, which is not the same as "signed out". */
  loggedIn: boolean | null;
  /** The account name, when something knew it. */
  user: string | null;
  /** What answered. Null when nothing did. */
  source: 'eas whoami' | 'EXPO_TOKEN' | null;
}

export interface NextActionStatus {
  /** The command to run next. */
  command: string;
  /**
   * Decision-table row that would fire to get the app onto a device, e.g. `expo-go`.
   *
   * Always the plan's row, even when {@link command} is not `exagent dev`: it is the project's
   * shape, and a reader that wants it does not stop wanting it because a dev server is up.
   */
  rule: string;
  target: ProjectTarget;
  /** The steps {@link command} would run. Empty for a command that is not `exagent dev`. */
  steps: PlanStep[];
  /**
   * Why this command rather than the plan's own. Null when it *is* the plan's own.
   *
   * Set exactly when a dev server this project can use is already answering: recommending a second
   * one then contradicts the dev-server line three rows above it, and the useful next move is to
   * verify the server that is running rather than to start another.
   */
  why: string | null;
}

/** Sections of the report, in the order they print. */
export type StatusSectionName =
  | 'project'
  | 'expoGo'
  | 'freshness'
  | 'devServer'
  | 'skills'
  | 'auth'
  | 'next';

/**
 * Everything `exagent status` answers, in one object.
 *
 * A section is `null` when it could not be read, and never missing: status always prints what it
 * can, so a broken probe costs one section instead of the whole command.
 */
export interface StatusReport {
  project: ProjectStatus | null;
  expoGo: ExpoGoStatus | null;
  freshness: FreshnessStatus | null;
  devServer: DevServerStatus | null;
  skills: SkillsStatus | null;
  auth: AuthStatus | null;
  next: NextActionStatus | null;
  /**
   * The raw project probe the sections above are summarized from, verbatim.
   *
   * This is the project brief the former `exagent context` printed: the sections answer "where is
   * this project", and every fact they round off — the Expo Go reasons, the fingerprint error —
   * is readable here, so no caller needs a second command. Null exactly when `project` is.
   */
  probe: ProjectState | null;
  /** Why a section is null, keyed by the section it belongs to. */
  errors: Partial<Record<StatusSectionName, string>>;
}
