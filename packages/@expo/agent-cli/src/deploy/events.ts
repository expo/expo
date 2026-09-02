import { events } from '2g';

import type { DeployTarget } from './types';

declare module '2g' {
  interface EventRegistry {
    /** The tools one deploy run resolved, before it spends anything on them. */
    'deploy:resolved': {
      targets: DeployTarget[];
      easCli: string | null;
      easCliSource: string;
      /** The `create-launch` invocation of the native rail, or null when it is not shipping. */
      launchCli: string | null;
    };
    /** The target a bare `@expo/agent-cli deploy` decided on from the project state. */
    'deploy:target_defaulted': { target: DeployTarget };
    /** The `expo export` subprocess of the web deploy. */
    'deploy:export': { command: string; args: string[] };
    /** A web deployment that finished. `url` is null when it could not be read from the output. */
    'deploy:web': { url: string | null; exportDir: string };
    /**
     * The launch created for the native platforms. The URL is the browser step the user has to
     * take, so an agent reading only the event stream can hand it over.
     */
    'deploy:launch': { id: string; url: string; framework: string };
  }
}

export const event = events('deploy');
export const debugEvent = events.debug('deploy');
