import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    /** The `create-expo` subprocess that was resolved and spawned, for debugging a bad scaffold. */
    'new:create_expo': { command: string; args: string[] };
    /**
     * The project that now exists on disk. The whole result of `@expo/agent-cli new`, so an agent reading
     * only the event stream learns the same as one reading stdout.
     */
    'new:created': {
      projectRoot: string;
      /** Display name written into `app.json`, or null when `--name` was not used. */
      name: string | null;
      installed: boolean;
      gitInitialized: boolean;
    };
  }
}

export const event = events('new');
export const debugEvent = events.debug('new');
