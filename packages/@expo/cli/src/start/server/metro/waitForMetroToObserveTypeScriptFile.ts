import path from 'path';

import type { ServerLike } from '../BundlerDevServer';

const debug = require('debug')('expo:start:server:metro:waitForTypescript') as typeof console.log;

/**
 * Use the native file watcher / Metro ruleset to detect if a
 * TypeScript file is added to the project during development.
 */
export function waitForMetroToObserveTypeScriptFile(
  projectRoot: string,
  runner: {
    metro: import('metro').Server;
    server: ServerLike;
  },
  callback: () => Promise<void>
): () => void {
  const watcher = runner.metro.getBundler().getBundler().getWatcher();

  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  const listener = ({
    eventsQueue,
  }: {
    eventsQueue: {
      filePath: string;
      metadata?: {
        type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
      } | null;
      type: string;
    }[];
  }) => {
    for (const event of eventsQueue) {
      if (
        event.type === 'add' &&
        event.metadata?.type !== 'd' &&
        // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
        !/node_modules/.test(event.filePath)
      ) {
        const { filePath } = event;
        // Is TypeScript?
        if (
          // If the user adds a TypeScript file to the observable files in their project.
          /\.tsx?$/.test(filePath) ||
          // Or if the user adds a tsconfig.json file to the project root.
          filePath === tsconfigPath
        ) {
          debug('Detected TypeScript file added to the project: ', filePath);
          callback();
          off();
          return;
        }
      }
    }
  };

  debug('Waiting for TypeScript files to be added to the project...');
  watcher.addListener('change', listener);

  const off = () => {
    watcher.removeListener('change', listener);
  };

  runner.server.addListener?.('close', off);
  return off;
}

/**
 * Use the native file watcher / Metro ruleset to detect if a
 * TypeScript file is added to the project during development.
 */
export function observeApiRouteChanges(
  projectRoot: string,
  runner: {
    metro: import('metro').Server;
    server: ServerLike;
  },
  callback: (filepath: string, operation: string) => Promise<void>
): () => void {
  const watcher = runner.metro.getBundler().getBundler().getWatcher();

  const appDir = path.join(projectRoot, 'app');
  const listener = ({
    eventsQueue,
  }: {
    eventsQueue: {
      filePath: string;
      metadata?: {
        type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
      } | null;
      type: string;
    }[];
  }) => {
    for (const event of eventsQueue) {
      if (
        // event.type === 'add' &&
        // event.metadata?.type !== 'd' &&
        // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
        !/node_modules/.test(event.filePath) &&
        event.filePath.startsWith(appDir) &&
        event.filePath.match(/\+api\.[tj]sx?$/)
      ) {
        const { filePath } = event;
        callback(filePath, event.type);
      }
    }
  };

  watcher.addListener('change', listener);

  const off = () => {
    watcher.removeListener('change', listener);
  };

  runner.server.addListener?.('close', off);
  return off;
}
