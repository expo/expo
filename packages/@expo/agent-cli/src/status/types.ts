// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// The shape of the status report: one object with a section per question the command answers.
// Pure data, so the human formatter and the `--json` output describe exactly the same facts.

import type { DevServerHostType } from '../dev/advertisedUrl';
import type { LocalDeviceState } from '../device/localDevice';
import type { ChangedFiles, ChangedSource, ImpactClass, OtaSafety } from '../impact/types';
import type { ConnectUrl } from '../navigate/connectUrl';
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
   * This package declares `expo`, which is what makes it an Expo app.
   *
   * `status` is the one command that answers here rather than refusing: it is how a caller finds
   * out it is in the wrong directory, so taking the answer away would leave nothing to read
   * (llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app). Every other field below describes a package that may not
   * be this CLI's subject at all, and this is the field that says which.
   */
  isExpoApp: boolean;
  /**
   * The version of the **installed `expo` package**, e.g. `57.0.15`. Null when it is unresolvable.
   *
   * The code that is actually on disk, not the SDK line the app config names. `inspect:config-plugins`
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
 * @see llp/0004-smart-start-and-project-state.rfc.md §Status
 */
export interface FreshnessImpact {
  /**
   * `js-only`, `dev-client-compatible`, `needs-native-build` — or **null**, when nothing was
   * established.
   *
   * Deliberately nullable, where a *gate* could not be. `--assert` compares against a class and
   * "unknown" cannot be gated on, so the obvious move is to round this up to the conservative
   * `needs-native-build`; the report does not, and `--assert` exits `22` on the null instead. The
   * report stays honest and the gate stays safe. See llp/0011 §The classifier reads reasons.
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

/**
 * Which build a freshness answer is about.
 *
 * Two axes, because "is my app up to date" has two answers and they disagree routinely: a project
 * whose native surface matches a finished **EAS** build needs no build here, and the report used to
 * call it `stale (no recorded build)` because it only ever looked at what this machine built
 * [observed — cloud loop, 2026-08-27, K7]. Backend × platform is four answers, and each one
 * is a fact somebody acts on.
 *
 * @ref llp/0021-honest-reports.rfc.md §The rules
 */
export type FreshnessBackend =
  /** What `@expo/agent-cli` built on this machine, from the project's own record. */
  | 'local'
  /** What EAS has, from the build lookup keyed on this exact fingerprint. */
  | 'eas';

export interface PlatformFreshness {
  platform: NativePlatform;
  /** Which build this entry compared against. */
  backend: FreshnessBackend;
  state: FreshnessState;
  /** Short phrase explaining the state, e.g. "no recorded build". */
  detail: string;
  /**
   * Fingerprint of the build this entry compared against.
   *
   * The last build `@expo/agent-cli` recorded, on the `local` axis. Null on the `eas` axis: the lookup is
   * *keyed* on the working tree's own hash, so a build it found has that hash by construction and
   * there is no second fingerprint to report.
   */
  recordedHash: string | null;
  /** The EAS build that answered, on the `eas` axis. Null everywhere else. */
  buildId: string | null;
  /** The profile that build was made with, e.g. `simulator`. Null when the payload named none. */
  buildProfile: string | null;
  /**
   * What has changed since that build, and what it costs.
   *
   * Null when there is no fingerprint at all — the `state` above already says so, and repeating it
   * as a second unknown would be one non-fact printed twice. Computed from the probe's own sources
   * and the recorded ones, so it costs no subprocess.
   */
  impact: FreshnessImpact | null;
}

/** What the impact headline was measured against. */
export interface FreshnessComparison {
  /** `last-build` for the project's own record, `eas-build` for `--explain --build <id>`. */
  kind: 'last-build' | 'eas-build';
  /** What a person would call the base: `last build recorded by @expo/agent-cli`, `EAS build <id>`. */
  label: string;
  /**
   * The build id, for `eas-build`. Null otherwise.
   *
   * Written before the comparison runs, so a `--build <id>` that failed still echoes the target
   * the caller named (F66).
   */
  buildId: string | null;
  /**
   * Which platform the comparison is an answer about, or null when nothing established it.
   *
   * `eas fingerprint:compare --build-id` takes no platform, so this is the *build's* platform,
   * asked of EAS — or the one the caller named with `--platform`. Null means the comparison is
   * attributed to no platform at all, and every platform's impact says it was not compared: one
   * build is one platform, and copying its verdict onto both said an iOS build could run android
   * code [live staging, S1].
   */
  platform: 'ios' | 'android' | null;
}

/**
 * Where a fingerprint hash came from.
 *
 * @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
 * @ref llp/0021-honest-reports.rfc.md
 * A hash read off the project's own record is not a measurement of the project now, and a report
 * that printed the two the same way would be claiming a fresh reading it did not take. So the
 * source rides along with the hash, and a cached one carries the count that makes it checkable.
 */
export interface FingerprintHashSource {
  /** `computed` for a `fingerprint:generate` this run made, `cache` for the `.expo` record. */
  source: 'computed' | 'cache' | null;
  /** How many pinned files a `cache` answer was revalidated against. Null otherwise. */
  revalidatedAgainst: number | null;
  /**
   * What kind of check revalidated a `cache` answer — `mtime+size`. Null otherwise.
   *
   * Reported, not implied: the check is a stamp comparison and not a content hash, and a reader
   * weighing the answer needs to know which (llp/0023 §The key is a stamp, not a hash).
   */
  keyKind: string | null;
  /** When a `cache` answer was originally computed. Null otherwise. */
  computedAt: string | null;
  /**
   * How old a `cache` answer was when it was believed, in milliseconds. Null otherwise.
   *
   * The bound on everything the stamps cannot see, so it belongs in the report rather than in the
   * reader's head.
   */
  ageMs: number | null;
  /** What the revalidation could not cover. Empty when nothing was cached. */
  caveats: string[];
}

export interface FreshnessStatus {
  /** Current fingerprint of the native surface, or null when the tool is unavailable. */
  hash: string | null;
  /**
   * Where {@link hash} came from: measured now, or read off the project's record.
   *
   * Always present, so no consumer has to infer it from which flags were passed.
   */
  hashSource: FingerprintHashSource;
  /** Why the fingerprint is unavailable. */
  error?: string;
  platforms: PlatformFreshness[];
  /**
   * What the impact headline is measured against.
   *
   * Always present, so a reader never has to infer the base from which flags were passed. `--build`
   * replaces the **`eas` axis** of the platform it names and leaves the `local` axis alone: "is the
   * app I built here still current" and "does this differ from that cloud build" are two questions,
   * and one of them silently changing meaning would be worse than reporting both
   * (llp/0021 §The rules).
   */
  comparison: FreshnessComparison;
  /**
   * How many files changed, and of what sort. Null when no file-level view was available.
   *
   * Read only when the fingerprint says the native surface did **not** move, which is the one case
   * where it can change the answer — see {@link FreshnessImpact.class}.
   */
  changedFiles: ChangedFiles | null;
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
 * @see llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
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
   * not ready — `npx @expo/agent-cli smoke` is the command that waits for the answer.
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
   * would be reading somebody else's prose [decided, 2026-08-26].
   */
  tunnelUrl: string | null;
  /**
   * The URLs that point an app at this dev server, best first. Empty when no host can be named.
   *
   * The **encoded** launcher URL, not the address the dev server prints for itself: a development
   * build is opened with `<scheme>://expo-development-client/?url=<encoded origin>`, and the line a
   * tunnelled `expo start` writes to its own stdout is neither that nor a URL an HTTP client can use
   * [observed — 2026-08-27, K8]. An agent that copies what the terminal said fails; this is the
   * string that works, next to the address it was built from.
   *
   * @see src/navigate/connectUrl.ts
   * @ref llp/0021-honest-reports.rfc.md §The rules
   */
  openUrls: ConnectUrl[];
  /** Why the dev server did not answer. */
  reason?: string;
}

/** One device this machine has, as the status report lists it. */
export interface LocalDeviceEntry {
  /** `ios` or `android`. */
  platform: string;
  /** Simulator UDID or `adb` serial. */
  deviceId: string;
  /** What the platform tool called it, when it named one. */
  name: string | null;
}

/** What this machine has to open an app on, as the status report carries it. */
export interface LocalDeviceStatus {
  /** `present`, `absent`, or `unknown` when no platform tool could be run. */
  state: LocalDeviceState;
  /** Platform of the **first** device that was found, or null. See {@link devices}. */
  platform: string | null;
  /** Simulator UDID or `adb` serial of the first device that was found, or null. */
  deviceId: string | null;
  /** Simulator name of the first device, when the platform tool reported one. */
  name: string | null;
  /**
   * Every device this machine has, in the order the platform tools were asked.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §navigate — F106.
   * The three fields above describe one device because that is all a ladder needs. This section is
   * not a ladder: it answers "what does this machine have", and it answered it wrongly on the
   * machine that has two. iOS is probed first on macOS, so `status` printed
   * `device  ios iPhone 17 Pro (…)` on a run whose only connected app was Expo Go on
   * `emulator-5554` [observed — 2026-08-27] — and an agent that read the line concluded the app was
   * on iOS. Empty exactly when {@link deviceId} is null.
   */
  devices: LocalDeviceEntry[];
  /** Why the state is what it is. Null when a device was found. */
  reason: string | null;
}

export interface SkillsStatus {
  /** Agents selected by a previous `@expo/agent-cli skills` run, or null when none is cached. */
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
  /**
   * What answered. Null when nothing did.
   *
   * Both CLIs are asked, in that order, because they read the same session file and only the first
   * one can be a stranger: a machine whose `eas` was a broken shim reported "nothing could answer"
   * while `@expo/agent-cli whoami` printed the name (F65). The source is reported so a reader knows which
   * CLI the answer came from.
   */
  source: 'eas whoami' | 'expo whoami' | 'EXPO_TOKEN' | null;
}

export interface NextActionStatus {
  /** The command to run next. */
  command: string;
  /**
   * Decision-table row that would fire to get the app onto a device, e.g. `expo-go`.
   *
   * Always the plan's row, even when {@link command} is not `@expo/agent-cli dev`: it is the project's
   * shape, and a reader that wants it does not stop wanting it because a dev server is up.
   */
  rule: string;
  target: ProjectTarget;
  /** The steps {@link command} would run. Empty for a command that is not `@expo/agent-cli dev`. */
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

/**
 * The verdict of `status --assert <class>`, and the one thing that can make this command non-zero.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §Status
 */
export interface AssertStatus {
  /** The class the caller said the change may cost at most. */
  asserted: ImpactClass;
  /** The strongest class actually found, or null when nothing established one. */
  actual: ImpactClass | null;
  /** Whether the gate passed. False for a stronger class *and* for a class nothing established. */
  ok: boolean;
  /**
   * The exit code the gate produced: `0`, `20` (stronger than asserted), or `22` (inconclusive).
   *
   * In the payload because an agent that captured stdout and lost the code can still read the
   * verdict, and because the three outcomes lead to three different next actions.
   */
  exitCode: number;
  /** One sentence: what the gate found, and why that is or is not a pass. */
  reason: string;
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
 * Everything `@expo/agent-cli status` answers, in one object.
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
   * offering `@expo/agent-cli navigate /` [observed — 2026-08-24].
   */
  device: LocalDeviceStatus | null;
  skills: SkillsStatus | null;
  auth: AuthStatus | null;
  next: NextActionStatus | null;
  /** The `--assert` verdict, or null when no assertion was made. */
  assertion: AssertStatus | null;
  /**
   * The raw project probe the sections above are summarized from, verbatim.
   *
   * This is the project brief the former `@expo/agent-cli context` printed: the sections answer "where is
   * this project", and every fact they round off — the Expo Go reasons, the fingerprint error —
   * is readable here, so no caller needs a second command. Null exactly when `project` is.
   */
  probe: ProjectState | null;
  /** Why a section is null, keyed by the section it belongs to. */
  errors: Partial<Record<StatusSectionName, string>>;
}
