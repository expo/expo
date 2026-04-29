import type MetroServer from '@expo/metro/metro/Server';
import type { ChangeEvent } from '@expo/metro/metro-file-map';
import type FileMap from '@expo/metro/metro-file-map';
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
    metro: MetroServer;
    server: ServerLike;
  },
  callback: () => Promise<void>
): () => void {
  // TODO(@kitten): This is highly inefficient. We shouldn't watch all changes to determine this
  // and instead use startup heuristic and do a pre-bundling check
  const watcher = runner.metro.getBundler().getBundler().getWatcher() as FileMap;
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  const listener = ({ changes }: ChangeEvent) => {
    for (const change of changes.addedFiles) {
      if (/node_modules/.test(change[0])) {
        // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
        continue;
      } else if (/\.tsx?$/.test(change[0]) || change[0] === tsconfigPath) {
        // If the user adds a TypeScript file to the observable files in their project.
        debug('Detected TypeScript file added to the project: ', change[0]);
        callback();
        off();
        return;
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

export function observeFileChanges(
  runner: {
    metro: MetroServer;
    server: ServerLike;
  },
  files: string[],
  callback: () => void | Promise<void>
): () => void {
  const watcher = runner.metro.getBundler().getBundler().getWatcher() as FileMap;
  const watchFilePaths = new Set(files);

  const listener = ({ changes }: ChangeEvent) => {
    for (const change of changes.addedFiles) {
      if (/node_modules/.test(change[0])) {
        // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
        continue;
      } else if (watchFilePaths.has(change[0])) {
        debug('Observed change:', change[0]);
        callback();
        return;
      }
    }
    for (const change of changes.modifiedFiles) {
      if (/node_modules/.test(change[0])) {
        // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
        continue;
      } else if (watchFilePaths.has(change[0])) {
        debug('Observed change:', change[0]);
        callback();
        return;
      }
    }
  };

  debug('Watching file changes:', files);
  watcher.addListener('change', listener);
  const off = () => {
    watcher.removeListener('change', listener);
  };
  runner.server.addListener?.('close', off);
  return off;
}

export function observeAnyFileChanges(
  runner: {
    metro: MetroServer;
    server: ServerLike;
  },
  callback: (events: ChangeEvent) => void | Promise<void>
): () => void {
  const watcher = runner.metro.getBundler().getBundler().getWatcher();

  const listener = (event: ChangeEvent) => {
    callback(event);
  };

  watcher.addListener('change', listener);

  const off = () => {
    watcher.removeListener('change', listener);
  };

  runner.server.addListener?.('close', off);
  return off;
}
