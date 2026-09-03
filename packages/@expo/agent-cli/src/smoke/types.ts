// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// What one `@expo/agent-cli smoke` run amounts to, as data.
//
// Kept apart from the phase runner so the shape of the answer can be read on its own, and so the
// formatter and the follow-ups depend on the shape rather than on the machinery that fills it.

import type { ScreenshotResult } from '../device/screenshot';
import type { FollowUp } from '../followups';
import type { RouteCheckJson } from '../navigate/routeCheck';
import type { BundleCheckJson } from '../runtime/bundleCheck';
import type { DevServerSource } from '../runtime/devServer';
import type { RuntimeErrorRecord } from '../runtime/runtimeErrorCollector';

/**
 * The phases of a smoke run, in the order they happen.
 *
 * A closed set, and reported as one: an agent branching on "which step of the gate failed" must
 * not have to match English. Each is the question of one existing command, asked without leaving
 * this process (llp/0005 §The smoke gate).
 */
export type SmokePhaseId =
  /**
   * Was a dev server started for this run?
   *
   * **Conditional**: it is in the list only on a run that performed it. A run that found one has
   * not skipped a start, it never had one to do, and a `skipped` row there would read as a step
   * that was owed (llp/0005 §The run brings its own environment).
   */
  | 'start-dev-server'
  /** Is there a dev server, and is it this project's to talk to? */
  | 'dev-server'
  /** Has its bundler finished, and does it serve this project? */
  | 'bundler-ready'
  /** Does this project's own entry bundle compile? */
  | 'bundle'
  /** Was a simulator or an emulator booted for this run? Conditional, like `start-dev-server`. */
  | 'boot-device'
  /**
   * Was the app put on that device for this run?
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
   * **Conditional**, and for the same reason the two above it are: installing is an *act*. A
   * machine that already had the app did not skip an install, it never had one to do.
   */
  | 'install-app'
  /** Is an app attached to it, and if not, can one be opened? */
  | 'app'
  /**
   * Is the app that answers the rest of this run the code that is on disk?
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
   * The phase that makes the four after it mean something. An app this run opened fetched the
   * served bundle on its way up, so it is `skipped` there and the reason says so. An app that was
   * *already* attached is running whatever it last loaded, which after an edit is the code the
   * caller has already replaced — so it is reloaded, and the reload has to be proved rather than
   * assumed (llp/0005 §What proves a reload).
   */
  | 'reload'
  /** Did the route the caller named open? */
  | 'route'
  /** Can the runtime be read at all? */
  | 'runtime'
  /** What did the app report while it was watched? */
  | 'errors'
  /** Is there a picture of the screen? */
  | 'screenshot';

/**
 * What one phase did.
 *
 * `skipped` is not a quiet `ok`, and keeping them apart is the point: a phase that did not run has
 * proved nothing, and a gate whose skipped phases read as passes is the class of false green this
 * command exists to remove.
 */
export type SmokePhaseStatus =
  /** It ran and answered yes. */
  | 'ok'
  /** It ran and answered no. */
  | 'failed'
  /** It ran and could not decide: a wait expired, or a runtime would not answer. */
  | 'inconclusive'
  /** It did not run, and {@link SmokePhase.reason} says why. */
  | 'skipped';

export interface SmokePhase {
  id: SmokePhaseId;
  status: SmokePhaseStatus;
  /** How long it took, in milliseconds. Zero for a phase that did not run. */
  ms: number;
  /**
   * One sentence about the answer.
   *
   * Present for everything but a plain `ok`, and always present for `skipped` — a phase that did
   * not run has to say why, or the report reads as though it had.
   */
  reason: string | null;
}

/**
 * The verdict of the whole run.
 *
 * Three, not two, and the third is what llp/0005-runtime-loop-tools.rfc.md §Android forced: a runtime with no debugger
 * answers an error window with silence, and silence there is indistinguishable from health. A
 * gate that cannot read the app must never report that the app is fine.
 */
export type SmokeOutcome =
  /** Every phase that ran answered yes, and the ones that decide were among them. */
  | 'passed'
  /** Something is wrong with the app or the project, and the payload says what. */
  | 'failed'
  /** Nothing was shown to be wrong and nothing was proved right. */
  | 'inconclusive';

/**
 * What this run did about the dev server it needed.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
 * A closed set, because the difference between these four decides what the *machine* looks like
 * afterwards, and an agent must not have to read English to tell "I left your dev server alone"
 * from "I started one and took it away again".
 */
export type SmokeDevServerDisposition =
  /** One was already running, and it is still running. */
  | 'reused'
  /** This run started one, and stopped it again. */
  | 'started'
  /** This run tried to start one and could not. */
  | 'failed'
  /** There was none and this run did not start one — `--no-start`, or nothing needed it. */
  | 'absent';

/** The same four for the device, with the word that fits a simulator. */
export type SmokeDeviceDisposition = 'reused' | 'booted' | 'failed' | 'absent';

/** Which of the two things a run can bring with it. */
export type SmokeResource = 'dev-server' | 'device';

/** One thing this run started and then put back. */
export interface SmokeCleanupJson {
  resource: SmokeResource;
  /** What was released: the dev server's origin, or the device's id. Null when it had no name. */
  target: string | null;
  /** Whether it went. */
  ok: boolean;
  /** Why it did not. Null exactly when {@link ok} is true. */
  reason: string | null;
  /** How long it took, in milliseconds. */
  ms: number;
}

/**
 * What this run found, what it started, and what it put back.
 *
 * The command's answer used to be only about the app. It is now also about the machine: a run that
 * boots a simulator and starts a dev server changes what is on the developer's laptop, and a report
 * that did not say so would leave them to discover it from a busy port.
 */
export interface SmokeEnvironmentJson {
  devServer: SmokeDevServerDisposition;
  device: SmokeDeviceDisposition;
  /**
   * Why this device rather than another, in one clause. Null when this run chose none.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
   * A machine has ten simulators and a run boots one of them; which one, and on what grounds, is
   * the difference between a gate that works and twelve seconds spent on a device that could never
   * have opened the app. `"it has Expo Go installed"`, `"it was already booted"`.
   */
  deviceChoice: string | null;
  /**
   * Everything this run put back, newest first.
   *
   * Empty for a run that started nothing — which is most runs. A failed entry is reported here
   * rather than folded into {@link SmokeResultJson.outcome}: the verdict is about the app, and a
   * dev server that would not stop says nothing about whether the app boots.
   */
  cleanup: SmokeCleanupJson[];
}

/**
 * Whether the app the rest of the run read was the code on disk, and what says so.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
 * The narrow claim, and it has to be narrow: this says the app fetched the bundle the dev server is
 * serving *after* this run arrived. It does not say the bundle contains any particular edit — the
 * dev server's own freshness is the `bundle` phase's question, and nothing here re-answers it.
 */
export interface SmokeReloadJson {
  /**
   * What this run did about it.
   *
   * `not-needed` — this run opened the app, so it fetched the served bundle on its way up and
   * there was never a stale session to replace. `reloaded` — it was already attached and was put
   * back on the served bundle, with {@link verifiedBy} naming the proof. `unproved` — the reload
   * was attempted and nothing was observed to come of it, so what the later phases read might be
   * either session. `declined` — `--no-reload`, so the app was read on the bundle it already had.
   */
  disposition: 'not-needed' | 'reloaded' | 'unproved' | 'declined';
  /**
   * What proved it, or null when nothing did.
   *
   * The same four labels `runtime:reload --json` uses, from the same observations, and under the
   * same rule: a label may be named only when its own evidence is in this payload and non-empty
   * (llp/0021 §The rules band).
   */
  verifiedBy: 'message-socket-peers' | 'fresh-debugger-target' | 'dev-server-bundle' | null;
  /**
   * Debugger targets the dev server had listed *before* the reload, by id.
   *
   * The evidence behind `fresh-debugger-target`: Metro's page ids come from a counter it does not
   * rewind, so a target under an id that is not in this list is an app that came back.
   */
  knownTargetIds: string[];
  /** Fresh targets seen after it. The count `fresh-debugger-target` rests on. */
  freshTargets: number | null;
  /** Whether the app's client on the dev server's command socket was replaced. */
  commandSocketReconnected: boolean | null;
  /** Whether the dev server served a bundle after this run acted. */
  bundleServed: boolean | null;
}

/** What the error window caught, summarized next to the records themselves. */
export interface SmokeErrorsJson {
  /** How long the window was open, in milliseconds. Null when it never opened. */
  windowMs: number | null;
  /** Everything that arrived. Null when the window never opened. */
  count: number | null;
  /**
   * How many of those were an `Error` the app reported, with its own stack.
   *
   * **The number the outcome is decided on**, and deliberately not "exceptions". React Native does
   * not deliver an uncaught `throw` as `Runtime.exceptionThrown` at all — it catches it and reports
   * it through the console path, so counting `source: 'exception'` would have been counting a
   * channel this runtime never uses [observed — 2026-08-24, live; see `RuntimeErrorRecord.isError`
   * for the three cases that were measured]. What is countable is whether a record carried the
   * error's own frames, and that is what this is.
   */
  failing: number | null;
  /** How many were a line of text the app logged with `console.error`, carrying no stack. */
  logs: number | null;
  /** The records, in the shape `runtime:errors --json` prints them. */
  records: RuntimeErrorRecord[];
}

/**
 * Machine shape of `@expo/agent-cli smoke --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout,
 * every key always present, and a fact the run does not have is null.
 */
export interface SmokeResultJson {
  /** Exactly `outcome === 'passed'`, for a caller that only wants the verdict. */
  ok: boolean;
  outcome: SmokeOutcome;
  /** Every phase, in order, whether it ran or not. */
  phases: SmokePhase[];
  devServerUrl: string;
  /** Which discovery step produced it: `flag`, `lock`, `log`, `default` or `scan`. */
  source: DevServerSource;
  /** Whether the dev server proved it serves this project; null when it could not be decided. */
  projectRootMatched: boolean | null;
  /**
   * A dev server was started by this run.
   *
   * Kept beside {@link environment}, which says the same thing with more detail, because it is the
   * key callers already branch on and `environment.devServer === 'started'` is the same fact.
   */
  started: boolean;
  /** What this run found on the machine, what it started, and what it put back. */
  environment: SmokeEnvironmentJson;
  /** Debugger targets attached when the run read them. Null when it never got that far. */
  appsConnected: number | null;
  /** The same `bundle` object `dev:wait` and `runtime:reload` print, from the same check. */
  bundle: BundleCheckJson;
  /** Route the run opened, or null when none was asked for. */
  route: string | null;
  /** Whether that route was checked against the project's routes. */
  routeCheck: RouteCheckJson;
  /** Platform the run targeted. */
  platform: 'ios' | 'android';
  /** Device the run drove, or null when it never reached one. */
  deviceId: string | null;
  /**
   * Which device layer that was: `local-ios`, `local-android`, `cloud`, or null.
   *
   * `platform` no longer says where the device is — an EAS Simulator session runs iOS too — and
   * this is what makes `deviceId` readable: a UDID and a session id look nothing alike to a person
   * and identical to a parser.
   */
  deviceBackend: string | null;
  /** Whether the runtime answered an evaluation at all. Null when it was never asked. */
  runtimeSupported: boolean | null;
  /**
   * Whether the app the later phases read was the code on disk.
   *
   * Never null, for the same reason `bundle` is not: a run that stopped before this phase still
   * owes the reader the fact that nothing put the app on the served bundle, and a missing key
   * reads as a question that was never worth asking (llp/0006 §Output contract).
   */
  reload: SmokeReloadJson;
  /**
   * Why the app that answered cannot run this project, or null when it can.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
   * A `passed` is impossible while this is set, so a caller reading the verdict alone is never
   * misled — and one that wants to know *why* it could not decide reads this rather than the phase
   * list's prose.
   */
  appMismatch: string | null;
  errors: SmokeErrorsJson;
  screenshot: ScreenshotResult;
  /** How long the whole run took, in milliseconds. */
  durationMs: number;
  /** Fields carrying text the app produced, fenced per llp/0008. */
  untrusted: string[];
  followups: FollowUp[];
}
