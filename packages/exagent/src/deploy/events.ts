import { events } from '2g';

import type { DeployPlatform, DeployTarget } from './types';

declare module '2g' {
  interface EventRegistry {
    /** The tools one deploy run resolved, before it spends anything on them. */
    'deploy:resolved': { targets: DeployTarget[]; easCli: string; easCliSource: string };
    /** The target a bare `exagent deploy` decided on from the project state. */
    'deploy:target_defaulted': { target: DeployTarget };
    /** The `expo export` subprocess of the web deploy. */
    'deploy:export': { command: string; args: string[] };
    /** The `eas build` subprocess of the native deploy. */
    'deploy:build': { command: string; args: string[] };
    /** A web deployment that finished. `url` is null when it could not be read from the output. */
    'deploy:web': { url: string | null; exportDir: string };
    /** A native build that was started. `buildUrl` is null when it could not be read. */
    'deploy:native': { platform: DeployPlatform; profile: string; buildUrl: string | null };
  }
}

export const event = events('deploy');
export const debugEvent = events.debug('deploy');
