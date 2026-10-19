import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    'cli-interface:toggle-dev-menu': Record<string, never>;
    'cli-interface:open-more-tools': Record<string, never>;
    'cli-interface:open-platform': { platform: string; target: string };
    'cli-interface:toggle-runtime-mode': Record<string, never>;
    'cli-interface:clear-terminal': Record<string, never>;
    'cli-interface:open-debugger': Record<string, never>;
    'cli-interface:reload': Record<string, never>;
    'cli-interface:open-editor': Record<string, never>;
    'cli-interface:run-menu-action': { action: string };
    'cli-interface:send-dev-command': { commandName: string };
    'cli-interface:banners-failed': { error: SerializedError };
    'cli-interface:action-failed': { error: SerializedError };
  }
}

export const event = events.debug('cli-interface');
