import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    /**
     * The whole `@expo/agent-cli agents:setup` run, as the summary an agent can branch on.
     *
     * @see llp/0006-agent-native-cli-surface.rfc.md §Surface improvements
     */
    'agents:setup_completed': {
      /** Agent ids the run targeted. */
      agents: string[];
      skillsSynced: boolean;
      skillsDiscovered: number;
      /** `created`, `updated`, `skipped`, or null when `--no-agents-md` skipped the file. */
      agentsMdAction: string | null;
      noteCount: number;
    };
  }
}

export const event = events('agents');
export const debugEvent = events.debug('agents');
