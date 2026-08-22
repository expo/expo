import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'cli:expo_resolved': { command: string; args: string[] };
    'cli:expo_exit': { code: number; signal?: string };
    'cli:expo_spawn_failed': { command: string; error: SerializedError };
    'cli:skills_sync_failed': { error: SerializedError };
    'cli:runtime_eval': { devServerUrl: string; threw: boolean; type: string };
    'cli:runtime_errors': { devServerUrl: string; durationMs: number; count: number };
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
    'cli:navigate': {
      route: string;
      url: string;
      platform: string;
      deviceId: string;
      exitCode: number | null;
    };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
