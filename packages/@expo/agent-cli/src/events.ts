import { events } from '2g';
import type { SerializedError } from '2g';

import type { FollowUp } from './followups/types';
import type { DevServerSource } from './runtime/devServer';

declare module '2g' {
  interface EventRegistry {
    'cli:expo_resolved': { command: string; args: string[] };
    'cli:expo_exit': { code: number; signal?: string };
    'cli:expo_spawn_failed': { command: string; error: SerializedError };
    /**
     * A command `@expo/agent-cli` does not implement was forwarded to the project's `expo` CLI verbatim.
     *
     * @see llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher
     */
    'cli:expo_passthrough': { command: string; args: string[] };
    /**
     * An auth command was answered, and by which CLI.
     *
     * `login`, `logout`, `register` and `whoami` act on the machine's `~/.expo` session rather than
     * on the project, so they fall back to the EAS CLI where there is no `expo` to forward to.
     * `source` is which of the four candidates ran, so a caller reading only the stream can tell a
     * forward from a fallback.
     *
     * @see src/passthrough/auth.ts
     */
    'cli:auth_passthrough': {
      command: string;
      args: string[];
      tool: 'expo' | 'eas';
      source: string;
      /** The invocation, as it would be written. */
      cli: string;
    };
    'cli:skills_sync_failed': { error: SerializedError };
    /**
     * A command failed with a known error. `suggestedCommand` is the machine-readable next
     * action — errors are prompts (llp/0006 §Errors are prompts). `needsHuman` says whether the
     * next action belongs to a person, so a consumer reading only this event still sees the class.
     */
    'cli:error': {
      code: string;
      message: string;
      suggestedCommand: string | null;
      needsHuman: boolean;
    };
    /**
     * A command stopped because only a person can complete the next step. Emitted right after the
     * `cli:error` of the same failure, which is also the run that exits `7`.
     *
     * @see llp/0010-agent-conventions.rfc.md §Needs-human protocol
     */
    'cli:needs_human': {
      code: string;
      scenario: string;
      need: string;
      command: string | null;
      url: string | null;
      unattendedEnv: string[];
      resumable: boolean;
      detectedBy: string;
    };
    /**
     * One `@expo/agent-cli dev:wait` run: whether the bundler finished, whose bundle it is, and how long
     * the wait took. The command's exit code is the same answer, and this is where the detail is.
     *
     * Deferred from v1 (2026-08-26): the command is on the reference shelf
     * (`src/deferred/dev-wait/`), so nothing emits this now. The declaration stays as the schema a
     * consumer wrote against; `cli:smoke` is what a v1 run of the same gate emits.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md, llp/0016-v1-scope.rfc.md
     */
    'cli:dev_wait': {
      devServerUrl: string;
      /** Which step of discovery produced `devServerUrl`, e.g. `lock` or `scan`. */
      source: DevServerSource;
      /** The dev server answered `packager-status:running`. */
      ready: boolean;
      /** Whether the dev server serves this project; null when it could not be decided. */
      projectRootMatched: boolean | null;
      /**
       * Debugger targets attached when the wait ended, i.e. apps running the bundle.
       *
       * Null for `--platform web`: that list only holds native runtimes, so it answers a question
       * about another platform (llp/0010 §An empty target list is inconclusive).
       */
      appsConnected: number | null;
      waitedMs: number;
      timedOut: boolean;
      /**
       * What building this project's entry bundle answered.
       *
       * The location only: the code frame belongs in the command's own output, not on a stream
       * that may be collected somewhere else.
       */
      bundle: {
        /** `ok`, `broken`, `timeout`, `unknown`, or null when the check did not run. */
        outcome: string | null;
        platform: string | null;
        filename: string | null;
        lineNumber: number | null;
      };
    };
    'cli:runtime_eval': {
      devServerUrl: string;
      threw: boolean;
      type: string;
      /** How a promise the expression returned settled, or null when it returned no thenable. */
      promise: 'fulfilled' | 'rejected' | 'pending' | null;
    };
    'cli:runtime_errors': {
      devServerUrl: string;
      durationMs: number;
      count: number;
      /** How many of the collected errors got a stack mapped onto project files. */
      symbolicated: number;
    };
    /**
     * One `@expo/agent-cli runtime:tree` run: what the walk was scoped to, and how much it kept.
     *
     * `focusedScreen` is null when focus could not be established, which is not a failure — it is
     * the honest answer for an app whose navigator does not expose it, and the run reports the
     * whole tree instead (llp/0018-interaction-commands.rfc.md §Must not lose).
     *
     * @see llp/0018-interaction-commands.rfc.md, llp/0018-interaction-commands.rfc.md
     */
    'cli:runtime_tree': {
      devServerUrl: string;
      /** The `--testID` the caller named, or null for the whole screen. */
      testID: string | null;
      focusedScreen: string | null;
      /** How many React Navigation screens the walk met, focused or not. */
      screensSeen: number;
      /** `interactive` (the default) or `full`. */
      projection: string;
      allScreens: boolean;
      /** How many nodes the projection kept, before any truncation. */
      nodeCount: number;
      truncated: boolean;
      /** How many **elements** carry the named testID. Zero without a `--testID`. */
      matched: number;
    };
    /**
     * One `@expo/agent-cli runtime:tap` run: which element, whose handler, and whether it was called.
     *
     * `handlerOutsideMatch` is the field to watch: true means the handler came from an ancestor of
     * the element that was named, which is what a real touch would reach and not what was asked
     * for. `called` with a `threw` is a tap that landed on a handler that raised.
     *
     * @see llp/0018-interaction-commands.rfc.md §Must not lose
     */
    'cli:runtime_tap': {
      devServerUrl: string;
      testID: string;
      /** How many elements carry the testID inside the scope that was searched. */
      matched: number;
      index: number | null;
      handlerOn: string | null;
      handlerOutsideMatch: boolean | null;
      disabled: boolean | null;
      /** Whether `--force` overrode a disabled element. */
      forced: boolean;
      called: boolean;
      threw: boolean;
      /** Why nothing was called, or null when something was. */
      reason: string | null;
      /** Whether `--verify` walked the tree again afterwards. */
      verified: boolean;
      /** What that second walk saw, or null when there was none. */
      changed: boolean | null;
    };
    /**
     * One `@expo/agent-cli runtime:type` run: which input, and whether the submit was made.
     *
     * The text itself is not on the event: it is the caller's own, and a value typed into an app is
     * as likely to be a credential as it is to be a note.
     *
     * @see llp/0018-interaction-commands.rfc.md §Must not lose
     */
    'cli:runtime_type': {
      devServerUrl: string;
      testID: string;
      matched: number;
      index: number | null;
      handlerOn: string | null;
      called: boolean;
      submitted: boolean;
      threw: boolean;
      reason: string | null;
    };
    /**
     * Deferred from v1 (2026-08-26): `runtime:network` is on the reference shelf
     * (`src/deferred/runtime-network/`), so nothing emits this now.
     *
     * The declaration stays because it is the schema a consumer wrote against, and a deferral is
     * not a schema change — the command comes back emitting these fields or it comes back as
     * something else. See llp/0017 §runtime:network.
     */
    'cli:runtime_network': {
      devServerUrl: string;
      durationMs: number;
      count: number;
      /** How many of the collected requests the runtime reported as failed. */
      failedCount: number;
      /** How many of the collected requests the runtime never answered. */
      pendingCount: number;
    };
    /**
     * The whole `@expo/agent-cli status` report, as the summary an agent can branch on. The command
     * always exits 0, so this event is where the answer lives.
     *
     * @see llp/0004-smart-start-and-project-state.rfc.md §Status
     */
    'cli:status': {
      /** Decision-table row that would fire, or null when the project could not be probed. */
      rule: string | null;
      sdkVersion: string | null;
      expoGoCompatible: boolean | null;
      devServerRunning: boolean;
      /**
       * Apps connected whose debugger socket still opens, which is what a runtime command can read.
       *
       * Not the length of `/json/list` [friction run 6, F56]: a page an app left behind stays in
       * that list, and this used to count it while every runtime command refused it.
       */
      appsConnected: number;
      /** Targets the dev server listed, live or not. */
      appsListed: number;
      /** Of those, the ones nothing answered on. */
      appsStale: number;
      /** How a device off this machine reaches it: `tunnel`, `lan`, `localhost`, or null. */
      devServerHostType: string | null;
      /** The tunnel origin while it is current, null otherwise. */
      tunnelUrl: string | null;
      /**
       * The URL that opens this project's app on a device, best first, or null.
       *
       * The **encoded** launcher URL of a development build rather than the address the dev server
       * prints for itself, which is not one a client can open (llp/0021 §The rules
       * is not the dev server's). The whole list is in `--json`.
       */
      openUrl: string | null;
      /** Whether this machine has a device to open the app on: `present`, `absent`, `unknown`. */
      localDevice: string;
      /**
       * The freshest answer per platform, across both backends.
       *
       * A platform whose fingerprint matches a finished EAS build needs no native build, whatever
       * this machine has built (llp/0021 §The rules). The per-backend split is in
       * `--json`.
       */
      freshness: { ios: string | null; android: string | null };
      /**
       * Whether EAS has a finished build for this fingerprint: `found`, `none` or `unknown`.
       *
       * `unknown` on every run without `--explain` that had nothing cached, which is the common
       * case and is deliberately not rounded down to `none`.
       */
      easBuilds: { ios: string | null; android: string | null };
      /** Whether this run was allowed to call EAS, i.e. `--explain` was passed. */
      easBuildsAsked: boolean;
      /**
       * Where the project fingerprint came from: `computed` or `cache`.
       *
       * @ref llp/0023-fingerprint-caching.rfc.md §The report says where the answer came from
       * A cached hash is not a measurement of the project now, so the stream says which it was
       * rather than leaving a consumer to assume (llp/0021).
       */
      fingerprintSource: string | null;
      /** How many pinned files a cached hash was revalidated against. Null when it was computed. */
      fingerprintRevalidatedAgainst: number | null;
      /**
       * What the change since the last recorded build costs, per platform.
       *
       * `js-only`, `dev-client-compatible`, `needs-native-build`, or `null` when nothing could be
       * established — which is never rounded up to a class, however conservative that class would
       * be. See llp/0011 §The classifier reads reasons.
       */
      impact: { ios: string | null; android: string | null };
      /**
       * The `--assert` verdict, or null when nothing was asserted.
       *
       * The only thing in this report that decides an exit code, which is why it is on the event:
       * an agent that read the code and wants the sentence behind it finds it here.
       */
      assertion: {
        asserted: string;
        actual: string | null;
        ok: boolean;
        exitCode: number;
        reason: string;
      } | null;
      skillsDiscovered: number;
      skillsLinked: number;
      /** Sections that could not be read, e.g. `["project"]`. */
      sectionErrors: string[];
    };
    /**
     * One poll of `@expo/agent-cli build:wait`, while the wait is still running.
     *
     * Deferred from v1 (2026-08-26) with the two events below: the command is on the reference shelf
     * (`src/deferred/build-wait/`), so nothing emits these now. The declarations stay as the schema
     * a consumer wrote against. See llp/0016 and llp/0010 §Exit codes.
     *
     * Progress belongs here and not on stdout: `--json` prints exactly one object (llp/0006
     * §Output contract), so a wait that printed its polls would break the contract for the sake of
     * output nobody parses. `queuePosition` and `estimatedWaitTimeLeftSeconds` are what would turn
     * "still going" into an answer, and both are real `BuildFragment` fields — but both were
     * `null` on every poll of a full live wait [observed — 2026-08-26, staging, iOS and Android],
     * so a consumer must treat them as usually-absent rather than as the progress it reads.
     *
     * @see llp/0010-agent-conventions.rfc.md §Exit codes
     */
    'cli:build_wait_poll': {
      kind: 'build' | 'submission';
      id: string;
      /** Which poll this was, counting from 1. */
      poll: number;
      status: string | null;
      queuePosition: number | null;
      estimatedWaitTimeLeftSeconds: number | null;
      elapsedMs: number;
    };
    /**
     * A poll that did not answer. A network blip must not end a 45-minute wait, so this is a
     * progress event and not an error — `consecutiveFailures` is how close the wait is to giving up.
     */
    'cli:build_wait_poll_failed': {
      kind: 'build' | 'submission';
      id: string;
      poll: number;
      consecutiveFailures: number;
      /** Exit code of the view command, or null when it could not be spawned. */
      exitCode: number | null;
      message: string;
    };
    /**
     * How one wait ended. The exit code is the command's answer, and this is the same answer on
     * the event stream, for an agent reading only the JSONL.
     */
    'cli:build_wait': {
      kind: 'build' | 'submission';
      id: string;
      outcome: 'finished' | 'errored' | 'canceled' | 'timeout';
      status: string | null;
      waitedMs: number;
      polls: number;
      exitCode: number;
      /**
       * Whether this wait was interrupted rather than the build being canceled.
       *
       * Both end as `canceled` with the same exit code — the caller asked for the stop either way
       * — but only one of them means the build is still running, and the `--json` key set is fixed,
       * so the distinction lives here.
       */
      interrupted: boolean;
    };
    /**
     * One `inspect:build-log` run: what was read, and what the rule table made of it.
     *
     * The located line and its signature only — not the quoted context, which belongs in the
     * command's own output rather than on a stream that may be collected somewhere else. Every
     * field is null when no rule matched, which is a report and not a failure.
     *
     * @see llp/0012-build-explain.rfc.md
     */
    'cli:build_explain': {
      source: 'file' | 'stdin';
      lines: number;
      bytes: number;
      /** True when the log was longer than the line budget and the oldest lines were dropped. */
      truncated: boolean;
      phase: string | null;
      signature: string | null;
      line: number | null;
      confidence: string | null;
      /** How many other matches `--all` reported. Zero without the flag. */
      otherFailures: number;
    };
    /**
     * One `@expo/agent-cli inspect:config-plugins` run, as counts.
     *
     * Counts only, deliberately: an effective config carries bundle identifiers, URL schemes and
     * permission strings, which belong in the answer the caller asked for and not on a stream that
     * may be collected somewhere else.
     *
     * @see llp/0006-agent-native-cli-surface.rfc.md §Output contract
     */
    'cli:config_effective': {
      /**
       * The SDK the evaluated app config resolves to, e.g. `57.0.0`.
       *
       * Not `sdkVersion`: `cli:status` carries a field of that name and it is the version of the
       * installed `expo` package. See `EffectiveConfigReport.configuredSdkVersion`.
       */
      configuredSdkVersion: string | null;
      /** Platforms the report covers, e.g. `["ios", "android"]`. */
      platforms: string[];
      /** Mods introspected per platform, e.g. `{ ios: 5, android: 6 }`. */
      modCounts: { [platform: string]: number };
      pluginCount: number;
      /** How many of them the app config declared; the rest are auto-applied. */
      declaredPluginCount: number;
      expoAutolinkedModuleCount: number;
      /** How long the `expo config` subprocess took. */
      durationMs: number;
    };
    /**
     * One `@expo/agent-cli doctor:check` run. `parse` says how much of expo-doctor's prose was understood,
     * because the counts are only as good as the parse that produced them.
     */
    'cli:doctor_check': {
      passed: number;
      failed: number;
      parse: 'full' | 'best-effort' | 'failed';
      /** The code expo-doctor exited with, which the command mirrors. */
      exitCode: number | null;
    };
    /**
     * The plan one `@expo/agent-cli doctor:fix` run built, emitted before anything is applied.
     *
     * Deferred from v1 (2026-08-26): the fix half of `doctor` is on the reference shelf
     * (`src/deferred/doctor-fix/`), so nothing emits this now. The declaration stays as the schema
     * a consumer wrote against. See llp/0016 and llp/0017 §doctor:fix.
     *
     * Ids and counts only: the targets are absolute paths on the user's machine, and the plan is
     * printed in full on the command's own output where the caller asked for it.
     *
     * @see llp/0017-deferred-commands.reference.md §doctor:fix
     */
    'cli:doctor_fix_plan': {
      tier: 'safe' | 'moderate' | 'aggressive';
      /** Whether the steps ran. `false` is a dry run, which is the default. */
      applied: boolean;
      /** Step ids, in the order they would run. */
      steps: string[];
      /** Ids of the steps this project does not have, or that the run did not opt into. */
      skipped: string[];
      /** Whether `--allow-machine-wide` was passed. */
      allowMachineWide: boolean;
      platforms: string[];
    };
    /**
     * One step of an applied `doctor:fix` plan, emitted as it finishes.
     *
     * Deferred from v1 (2026-08-26), with `cli:doctor_fix_plan` above.
     *
     * @see llp/0017-deferred-commands.reference.md §doctor:fix
     */
    'cli:doctor_fix_step': {
      id: string;
      kind: string;
      scope: 'project' | 'machine';
      status: 'done' | 'failed' | 'skipped';
      /** How many paths the step deleted. */
      targets: number;
      durationMs: number;
    };
    /**
     * One `@expo/agent-cli typecheck` run. Counts only: a diagnostic quotes the project's own identifiers
     * and types, which is not something to put on a telemetry stream.
     */
    /**
     * What installing one or more **packages** costs, from `@expo/agent-cli install`.
     *
     * The *other* thing called impact (llp/0011 §Two things called impact): this classifies a
     * package, and the change classifier — what a working-tree diff costs — is on `cli:status`
     * under `impact` and `assertion`. `@expo/agent-cli impact` used to emit this name with a different
     * payload; the command was folded into `status` on 2026-08-26 and `install` is the only
     * producer left, so the schema is now what it actually sends.
     *
     * @see llp/0011-impact-and-freshness.rfc.md
     */
    'cli:impact': {
      /** The packages that were classified. */
      packages: string[];
      /** One entry per package: what it is, and what must rerun after installing it. */
      reports: {
        packageName: string;
        impact: string;
        expoGoBundled: boolean;
        action: string;
        reasons: string[];
      }[];
    };
    'cli:typecheck': {
      /** Whether a compiler ran at all. False for a project with no TypeScript in it. */
      checked: boolean;
      errorCount: number;
      /** How long the compiler took. `0` when it never ran. */
      durationMs: number;
    };
    /**
     * One `@expo/agent-cli runtime:reload` run: whether the app was reloaded, by which method, and how
     * many apps were attached afterwards. The exit code is the same answer; this is where the
     * detail is.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md §Reloading the app
     */
    'cli:runtime_reload': {
      /** The app was reloaded, and the reload was observed rather than assumed. */
      reloaded: boolean;
      /** `dev-server`, `device`, or null when neither worked. */
      method: string | null;
      /** Debugger targets attached when the wait ended, i.e. apps running the new bundle. */
      appsConnected: number;
      /**
       * How many of those the dev server had not listed before the reload.
       *
       * The number the outcome is decided on: a reloading app's previous target stays listed for
       * about half a second, so a non-zero `appsConnected` alone is not the app being back.
       */
      appsReconnected: number;
    };
    /**
     * One `@expo/agent-cli dev:stop` run: whether a dev server was stopped, whose it was, and why not.
     *
     * @see llp/0004-smart-start-and-project-state.rfc.md §Daemonization
     */
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
    'cli:dev_detach': {
      url: string;
      port: number;
      /** PID of the detached process, which is what `dev:stop` signals. */
      pid: number;
      /** Whether the bundler answered, or null when `--wait-ready` was not asked for. */
      ready: boolean | null;
      /** The project already had a dev server, so nothing was started. */
      alreadyRunning: boolean;
      /**
       * `building` while the plan's dev-server step is still compiling, `serving` otherwise.
       *
       * `url` is where the dev server *will* listen, not always where one is: the lock is published
       * when the dev-server step starts, and `expo run:*` builds and installs before it serves
       * (llp/0004 §Implemented in v1, F125).
       */
      phase: 'building' | 'serving';
      /**
       * The busy port this run was moved off, or null when it did not move — and also null when
       * it moved off a port the Expo CLI declined to name. `port` above is where it landed.
       */
      portMovedFrom: number | null;
      /**
       * The tunnel origin this run is reachable at, or null.
       *
       * The address a device off this machine uses, which `url` — where the dev server listens
       * here — never is for a tunnelled run.
       */
      tunnelUrl: string | null;
    };
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
    'cli:dev_logs': {
      /** The file that was read, or null when the project has none. */
      logFile: string | null;
      /** How many lines were printed. */
      lines: number;
      /** How many lines the file has. */
      totalLines: number;
    };
    'cli:dev_stop': {
      /** A dev server was running and is not running now. */
      stopped: boolean;
      /** PID that was signalled, or the listener's PID when one was found but not signalled. */
      pid: number | null;
      port: number | null;
      /** Whether a dev-server lock answered: this CLI's dev server, or a stranger's. */
      lockHeld: boolean;
      /** `not-running`, `foreign-dev-server`, `still-running`, or null when it stopped. */
      reason: string | null;
    };
    /**
     * One `@expo/agent-cli runtime:stop` run: whether the app is stopped, and which app it was.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md §Stopping the app
     */
    'cli:runtime_stop': {
      /** The app is not running on the device now. */
      stopped: boolean;
      /**
       * It was running when the command started, so this is what stopped it.
       *
       * Null on a cloud session, where the controller's answer is not about the application id
       * (llp/0005 §Cloud simulator).
       */
      wasRunning: boolean | null;
      platform: string;
      /** Which device layer acted: `local-ios`, `local-android`, or `cloud`. */
      deviceBackend: string;
      deviceId: string;
      bundleId: string;
      /**
       * `--app-id` named an app that was not running, while the dev server reports another one
       * that is. The run stopped nothing, and exits 20 (llp/0005 §Stopping the app).
       */
      appIdMismatch: boolean;
    };
    /**
     * One `@expo/agent-cli smoke` run: the verdict, and every phase that produced it.
     *
     * The phases are on the stream as well as in the report because the report may be the human
     * one, and an agent watching a run it did not ask for `--json` from still needs to know which
     * step of the gate decided the answer.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md §The smoke gate
     */
    /**
     * The start phase is about to run a plan that **compiles**, before it waits on it.
     *
     * @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
     * Emitted before the build rather than after, because its whole purpose is to tell a reader
     * that a long wait is starting and is not a hang. The human sentence goes to stderr; this is
     * the same fact for a reader of the stream.
     */
    'cli:smoke_building': {
      platform: 'ios' | 'android';
      /** Where the plan builds: `local` for this machine, `eas` for a cloud build. */
      where: string;
    };
    'cli:smoke': {
      /** `passed`, `failed` or `inconclusive`. */
      outcome: string;
      devServerUrl: string;
      /** Which discovery step produced it, or null when nothing answered. */
      source: string | null;
      /** A dev server was started by this run. The same fact as `devServer: "started"`. */
      started: boolean;
      /**
       * What this run did about the dev server: `reused`, `started`, `failed` or `absent`.
       *
       * @see llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
       */
      devServer: string;
      /** The same about the device: `reused`, `booted`, `failed` or `absent`. */
      device: string;
      /**
       * What this run started and could **not** put back, as `dev-server` and `device`.
       *
       * Empty on almost every run, and the one thing on this event that is about the machine
       * rather than about the app: a caller reading only the outcome would never learn that a
       * passing run left a dev server behind.
       */
      leftBehind: string[];
      /** Debugger targets attached when the run read them, or null when it never got that far. */
      appsConnected: number | null;
      /** `ok`, `broken`, `timeout`, `unknown`, or null when the check did not run. */
      bundle: string | null;
      /** Whether the runtime answered an evaluation; null when it was never asked. */
      runtimeSupported: boolean | null;
      /** How many records the window caught, or null when it never opened. */
      errorCount: number | null;
      /** Whether a picture of the screen was taken. */
      screenshot: boolean;
      durationMs: number;
      /** Each phase, with what it answered and how long it took. Never a reason: that is prose. */
      phases: { id: string; status: string; ms: number }[];
    };
    'cli:navigate': {
      route: string;
      url: string;
      /** Dev server the URL was built from. */
      devServerUrl: string;
      /** Which discovery step produced it: `flag`, `lock`, `log`, `default` or `scan`. */
      devServerSource: string;
      /**
       * Which device layer acted: `local-ios`, `local-android`, or `cloud`.
       *
       * Next to `platform` rather than folded into it: an EAS Simulator session runs iOS too, and
       * "the link opened on iOS" no longer says whether the device is on this desk.
       */
      deviceBackend: string;
      platform: string;
      deviceId: string;
      exitCode: number | null;
      /** The device port forwarded to this machine before the link, or null when none was. */
      reversedPort: number | null;
      /**
       * Whether an app on this platform was seen to attach afterwards, or null when no wait ran.
       *
       * The field that separates "the intent was delivered" from "the app is running the project"
       * (llp/0005-runtime-loop-tools.rfc.md §Android, F50). `exitCode` only ever answered the first.
       */
      attached: boolean | null;
      /**
       * The dev launcher URL this run opened **before** `url`, or null when it opened none.
       *
       * Non-null exactly when the app was not loaded and a development build was the target, which
       * is the ladder of F123: `url` navigates an app that is running, and this is what gets it
       * running (llp/0005 §Pointing an app at this dev server).
       */
      launchUrl: string | null;
    };
    /**
     * A route resolved to a URL with nothing opened (`navigate --print-url`).
     *
     * Its own name rather than a flag on `cli:navigate`, because the two are different outcomes: a
     * `cli:navigate` says a device took the link, and this says only that a URL exists for one to
     * take. An agent watching for "the app moved" must not read this as that.
     */
    'cli:navigate_url': {
      route: string;
      url: string;
      devServerUrl: string;
      devServerSource: string;
      /** `tunnel`, `lan`, `localhost`, or null when nothing captured what was advertised. */
      hostType: string | null;
    };
    /**
     * The state-aware next actions of the command that just ran. Emitted whenever follow-ups are
     * computed, in text and `--json` mode alike, so an agent reading only the event stream gets
     * the same answer as one reading the terminal.
     *
     * @see llp/0009-smart-followups.rfc.md §The follow-up block
     */
    'cli:followups': {
      /** The CLI command the follow-ups belong to, e.g. `start` or `runtime:errors`. */
      command: string;
      followups: FollowUp[];
    };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
