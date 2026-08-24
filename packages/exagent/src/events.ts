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
     * A command `exagent` does not implement was forwarded to the project's `expo` CLI verbatim.
     *
     * @see llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher
     */
    'cli:expo_passthrough': { command: string; args: string[] };
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
     * One `exagent dev:wait` run: whether the bundler finished, whose bundle it is, and how long
     * the wait took. The command's exit code is the same answer, and this is where the detail is.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md
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
       * about another platform (llp/0010 §What app counting can and cannot see).
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
     * The whole `exagent status` report, as the summary an agent can branch on. The command
     * always exits 0, so this event is where the answer lives.
     *
     * @see llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
     */
    'cli:status': {
      /** Decision-table row that would fire, or null when the project could not be probed. */
      rule: string | null;
      sdkVersion: string | null;
      expoGoCompatible: boolean | null;
      devServerRunning: boolean;
      /** Debugger targets the dev server reported, i.e. apps connected to it. */
      appsConnected: number;
      freshness: { ios: string | null; android: string | null };
      skillsDiscovered: number;
      skillsLinked: number;
      /** Sections that could not be read, e.g. `["project"]`. */
      sectionErrors: string[];
    };
    /**
     * One poll of `exagent build:wait`, while the wait is still running.
     *
     * Progress belongs here and not on stdout: `--json` prints exactly one object (llp/0006
     * §Output contract), so a wait that printed its polls would break the contract for the sake of
     * output nobody parses. `queuePosition` and `estimatedWaitTimeLeftSeconds` are what turn
     * "still going" into an answer, and both are real `BuildFragment` fields.
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
     * One `exagent config:effective` run, as counts.
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
     * One `exagent doctor:check` run. `parse` says how much of expo-doctor's prose was understood,
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
     * The plan one `exagent doctor:fix` run built, emitted before anything is applied.
     *
     * Ids and counts only: the targets are absolute paths on the user's machine, and the plan is
     * printed in full on the command's own output where the caller asked for it.
     *
     * @see llp/0013-doctor-fix.rfc.md
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
     * @see llp/0013-doctor-fix.rfc.md
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
     * One `exagent typecheck` run. Counts only: a diagnostic quotes the project's own identifiers
     * and types, which is not something to put on a telemetry stream.
     */
    'cli:typecheck': {
      /** Whether a compiler ran at all. False for a project with no TypeScript in it. */
      checked: boolean;
      errorCount: number;
      /** How long the compiler took. `0` when it never ran. */
      durationMs: number;
    };
    /**
     * One `exagent runtime:reload` run: whether the app was reloaded, by which method, and how
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
     * One `exagent dev:stop` run: whether a dev server was stopped, whose it was, and why not.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md §Stopping the dev server
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
    };
    // @ref llp/0005-runtime-loop-tools.rfc.md §Reading the detached dev server's output
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
     * One `exagent runtime:stop` run: whether the app is stopped, and which app it was.
     *
     * @see llp/0005-runtime-loop-tools.rfc.md §Stopping the app
     */
    'cli:runtime_stop': {
      /** The app is not running on the device now. */
      stopped: boolean;
      /** It was running when the command started, so this is what stopped it. */
      wasRunning: boolean;
      platform: string;
      deviceId: string;
      bundleId: string;
      /**
       * `--app-id` named an app that was not running, while the dev server reports another one
       * that is. The run stopped nothing, and exits 20 (llp/0005 §An `--app-id` nobody is running).
       */
      appIdMismatch: boolean;
    };
    'cli:navigate': {
      route: string;
      url: string;
      /** Dev server the URL was built from. */
      devServerUrl: string;
      /** Which discovery step produced it: `flag`, `lock`, `log`, `default` or `scan`. */
      devServerSource: string;
      platform: string;
      deviceId: string;
      exitCode: number | null;
    };
    /**
     * The state-aware next actions of the command that just ran. Emitted whenever follow-ups are
     * computed, in text and `--json` mode alike, so an agent reading only the event stream gets
     * the same answer as one reading the terminal.
     *
     * @see llp/0009-smart-followups.rfc.md §Design
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
