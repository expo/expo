// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The shape of the status report: one object with a section per question the command answers.
// Pure data, so the human formatter and the `--json` output describe exactly the same facts.

import type { DevServerHostType } from '../dev/advertisedUrl';
import type { LocalDeviceState } from '../device/localDevice';
import type { ChangedSource, ImpactClass, OtaSafety } from '../impact/types';
import type { NativePlatform } from '../plan/types';
import type { PlanStep, ProjectState, ProjectTarget } from '../project/types';
import type { DevServerSource } from '../runtime/devServer';
import type { PlanBuildLocation } from '../toolchain/types';

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

/**
 * What the change since the recorded build costs, as `status` can establish it for free.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §The impact headline is free, the explanation is not
 */
export interface FreshnessImpact {
  /**
   * `js-only`, `dev-client-compatible`, `needs-native-build` — or **null**, when nothing was
   * established.
   *
   * Deliberately nullable, where `exagent impact` is not. That command is a gate and has to name a
   * class because `--assert` compares against one; this is a report, and its `unknown`s are never
   * rounded down. See llp/0011 §Two commands, one classifier.
   */
  class: ImpactClass | null;
  /** Whether the native fingerprint moved. Null when it could not be decided. */
  fingerprintChanged: boolean | null;
  /** One sentence: the strongest finding, or why nothing could be decided. */
  reason: string;
  /** How many fingerprint sources moved. Null when no diff was possible. */
  changedCount: number | null;
  /** The per-source list. Present only under `--explain`; null otherwise. */
  changedSources: ChangedSource[] | null;
}

export interface PlatformFreshness {
  platform: NativePlatform;
  state: FreshnessState;
  /** Short phrase explaining the state, e.g. "no recorded build". */
  detail: string;
  /** Fingerprint of the last build `exagent` recorded for the platform. */
  recordedHash: string | null;
  /**
   * What has changed since that build, and what it costs.
   *
   * Null when there is no fingerprint at all — the `state` above already says so, and repeating it
   * as a second unknown would be one non-fact printed twice. Computed from the probe's own sources
   * and the recorded ones, so it costs no subprocess.
   */
  impact: FreshnessImpact | null;
}

export interface FreshnessStatus {
  /** Current fingerprint of the native surface, or null when the tool is unavailable. */
  hash: string | null;
  /** Why the fingerprint is unavailable. */
  error?: string;
  platforms: PlatformFreshness[];
  /**
   * Whether an update published now would reach installed builds that can run it.
   *
   * Present only under `--explain`: the `runtimeVersion` policy is resolved with an
   * `expo config --json --type public` subprocess, which is the kind of cost the default report
   * does not pay. Null on every other run — "not asked", not "not safe".
   *
   * @see llp/0011-impact-and-freshness.rfc.md §A fingerprint change is not "OTA-unsafe"
   */
  ota: OtaSafety | null;
}

/** Whether EAS has a finished build made from the project's current fingerprint. */
export type BuildLookupState =
  /** A finished build exists for this exact fingerprint, and can be downloaded instead of built. */
  | 'found'
  /** EAS was asked and has none. */
  | 'none'
  /** Nobody could ask, or nobody was allowed to. Never rounded down to `none`. */
  | 'unknown';

export interface PlatformBuild {
  platform: NativePlatform;
  state: BuildLookupState;
  /**
   * The **per-platform** fingerprint the question was about, which is the one an EAS build carries.
   *
   * Not {@link FreshnessStatus.hash}, which covers both platforms at once and is therefore a hash
   * no build has. Null when the answer came from nothing that computed one.
   */
  fingerprintHash: string | null;
  /** The build EAS has, when one was found. */
  buildId: string | null;
  createdAt: string | null;
  buildProfile: string | null;
  /** The artifact URL, when the payload carried one. */
  buildUrl: string | null;
  /** `cache` for the project's own record, `eas` for a lookup. Null when nothing answered. */
  source: 'cache' | 'eas' | null;
  /** Why the state is not `found`. Null when it is. */
  reason: string | null;
}

/**
 * What EAS already has for this project, per platform.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §The EAS build lookup, and why it is opt-in
 */
export interface BuildsStatus {
  /** Whether this run was allowed to call EAS. False on every run without `--explain`. */
  askedEas: boolean;
  platforms: PlatformBuild[];
}

export interface DevServerStatus {
  /** The dev server that was probed, default or `--dev-server-url`. */
  url: string;
  running: boolean;
  /**
   * Apps connected to the dev server **whose debugger socket still opens**.
   *
   * Not the length of `/json/list` [friction run 6, F56]. That list holds registrations, and a page
   * left behind by an app that was force-stopped stays in it — so this command reported `1 app
   * connected` while every runtime command answered `No target found`. Both were counting honestly;
   * they were counting different things. This one counts what can be talked to, which is what every
   * command a reader runs next needs.
   */
  appsConnected: number;
  /** Targets the dev server listed, live or not. Equal to {@link appsConnected} in the normal case. */
  appsListed: number;
  /** Of those, the ones nothing answered on. Reported so the difference above is never silent. */
  appsStale: number;
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
  /**
   * How a device **off this machine** reaches this dev server, per what the dev server printed.
   *
   * `localhost` and `lan` say the URL above is the only address there is, and neither is usable
   * from a cloud simulator. `tunnel` is the one that is. Null when nothing captured the line — a
   * dev server started in a terminal writes it there and nowhere this can read.
   *
   * @see src/dev/advertisedUrl.ts
   */
  hostType: DevServerHostType | null;
  /**
   * The tunnel origin, when this project's dev server is running with one.
   *
   * Null when the run had no tunnel or the dev server is not running. Whether the tunnel itself is
   * healthy is not asked here: that is the transport's business, and a wrapper that diagnosed it
   * would be reading somebody else's prose [decided — Kudo, 2026-08-26].
   */
  tunnelUrl: string | null;
  /** Why the dev server did not answer. */
  reason?: string;
}

/** What this machine has to open an app on, as the status report carries it. */
export interface LocalDeviceStatus {
  /** `present`, `absent`, or `unknown` when no platform tool could be run. */
  state: LocalDeviceState;
  /** Platform of the device that was found, or null. */
  platform: string | null;
  /** Simulator UDID or `adb` serial of the device that was found, or null. */
  deviceId: string | null;
  /** Simulator name, when the platform tool reported one. */
  name: string | null;
  /** Why the state is what it is. Null when a device was found. */
  reason: string | null;
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
  /**
   * Where the plan's native build would run, and what chose that. Null when it builds nothing.
   *
   * Reported here for the same reason {@link rule} is: it is a fact about the project and this
   * host that does not stop being true because a dev server happens to be up. On a machine that
   * cannot build for the target platform this is the line that says the next build is a cloud one
   * — before anybody waits many minutes to find out.
   *
   * @see llp/0015-backend-selection-and-config.rfc.md §What `status` reports
   */
  buildLocation: PlanBuildLocation | null;
}

/** Sections of the report, in the order they print. */
export type StatusSectionName =
  | 'project'
  | 'expoGo'
  | 'freshness'
  | 'builds'
  | 'devServer'
  | 'device'
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
  /**
   * Whether EAS already has a finished build of what is on disk right now.
   *
   * The other half of the freshness question. `freshness` answers "does the app **this machine**
   * built still match", and a `stale` there used to mean a rebuild; this answers "has anybody
   * already built exactly this", where the answer is a download instead.
   */
  builds: BuildsStatus | null;
  devServer: DevServerStatus | null;
  /**
   * Whether this machine has a device to open the app on.
   *
   * The fact every "open the app" suggestion assumed and none of them checked: a dogfood session
   * drove Expo Go on a **cloud** simulator from a laptop with no local one, and `next` kept
   * offering `exagent navigate /` [observed — 2026-08-24].
   */
  device: LocalDeviceStatus | null;
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
