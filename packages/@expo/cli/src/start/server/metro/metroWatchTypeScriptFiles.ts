import path from 'path';

import type { ServerLike } from '../BundlerDevServer';

const debug = require('debug')(
  'expo:start:server:metro:metroWatchTypeScriptFiles'
) as typeof console.log;

export interface MetroWatchTypeScriptFilesOptions {
  projectRoot: string;
  metro: import('metro').Server;
  server: ServerLike;
  /* Include tsconfig.json in the watcher */
  tsconfig?: boolean;
  callback: (event: WatchEvent) => void;
  /* Array of eventTypes to watch. Defaults to all events */
  eventTypes?: string[];
  /* Throlle the callback. When true and  a group of events are recieved, callback it will only be called with the
   * first event */
  throttle?: boolean;
}

interface WatchEvent {
  filePath: string;
  metadata?: {
    type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
  } | null;
  type: string;
}

/**
 * Use the native file watcher / Metro ruleset to detect if a
 * TypeScript file is added to the project during development.
 */
export function metroWatchTypeScriptFiles({
  metro,
  server,
  projectRoot,
  callback,
  tsconfig = false,
  throttle = false,
  eventTypes = ['add', 'change', 'delete'],
}: MetroWatchTypeScriptFilesOptions): () => void {
  const watcher = metro.getBundler().getBundler().getWatcher();

  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  const listener = ({ eventsQueue }: { eventsQueue: WatchEvent[] }) => {
    for (const event of eventsQueue) {
      if (
        eventTypes.includes(event.type) &&
        event.metadata?.type !== 'd' &&
        // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
        !/node_modules/.test(event.filePath) &&
        // Ignore declaration files
        !/\.d\.ts$/.test(event.filePath)
      ) {
        const { filePath } = event;
        // Is TypeScript?
        if (
          // If the user adds a TypeScript file to the observable files in their project.
          /\.tsx?$/.test(filePath) ||
          // Or if the user adds a tsconfig.json file to the project root.
          (tsconfig && filePath === tsconfigPath)
        ) {
          debug('Detected TypeScript file changed in the project: ', filePath);
          callback(event);

          if (throttle) {
            return;
          }
        }
      }
    }
  };

  debug('Waiting for TypeScript files to be added to the project...');
  watcher.addListener('change', listener);
  watcher.addListener('add', listener);

  const off = () => {
    watcher.removeListener('change', listener);
    watcher.removeListener('add', listener);
  };

  server.addListener?.('close', off);
  return off;
}
