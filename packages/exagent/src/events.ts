import { events } from '2g';
import type { SerializedError } from '2g';

import type { FollowUp } from './followups/types';

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
     * action — errors are prompts (llp/0006 §Errors are prompts).
     */
    'cli:error': {
      code: string;
      message: string;
      suggestedCommand: string | null;
    };
    'cli:runtime_eval': { devServerUrl: string; threw: boolean; type: string };
    'cli:runtime_errors': {
      devServerUrl: string;
      durationMs: number;
      count: number;
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
     * One `exagent config:effective` run, as counts.
     *
     * Counts only, deliberately: an effective config carries bundle identifiers, URL schemes and
     * permission strings, which belong in the answer the caller asked for and not on a stream that
     * may be collected somewhere else.
     *
     * @see llp/0006-agent-native-cli-surface.rfc.md §Output contract
     */
    'cli:config_effective': {
      sdkVersion: string | null;
      /** Platforms the report covers, e.g. `["ios", "android"]`. */
      platforms: string[];
      /** Mods introspected per platform, e.g. `{ ios: 5, android: 6 }`. */
      modCounts: { [platform: string]: number };
      pluginCount: number;
      /** How many of them the app config declared; the rest are auto-applied. */
      declaredPluginCount: number;
      autolinkedModuleCount: number;
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
    'cli:navigate': {
      route: string;
      url: string;
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
