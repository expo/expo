import chalk from 'chalk';
import { watchFile } from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { memoize } from './fn';
import * as Log from '../log';

const debug = require('debug')('expo:utils:fileNotifier') as typeof console.log;

/** Observes and reports file changes. */
export class FileNotifier {
  static instances: FileNotifier[] = [];

  static stopAll() {
    for (const instance of FileNotifier.instances) {
      instance.stopObserving();
    }
  }

  private unsubscribe: (() => void) | null = null;

  constructor(
    /** Project root to resolve the module IDs relative to. */
    private projectRoot: string,
    /** List of module IDs sorted by priority. Only the first file that exists will be observed. */
    private moduleIds: string[],
    private settings: {
      /** An additional warning message to add to the notice. */
      additionalWarning?: string;
    } = {}
  ) {
    FileNotifier.instances.push(this);
  }

  /** Get the file in the project. */
  private resolveFilePath(): string | null {
    for (const moduleId of this.moduleIds) {
      const filePath = resolveFrom.silent(this.projectRoot, moduleId);
      if (filePath) {
        return filePath;
      }
    }
    return null;
  }

  public startObserving(callback?: (cur: any, prev: any) => void) {
    const configPath = this.resolveFilePath();
    if (configPath) {
      debug(`Observing ${configPath}`);
      return this.watchFile(configPath, callback);
    }
    return configPath;
  }

  public stopObserving() {
    this.unsubscribe?.();
  }

  /** Watch the file and warn to reload the CLI if it changes. */
  public watchFile = memoize(this.startWatchingFile.bind(this));

  private startWatchingFile(filePath: string, callback?: (cur: any, prev: any) => void): string {
    const configName = path.relative(this.projectRoot, filePath);
    const listener = (cur: any, prev: any) => {
      if (prev.size || cur.size) {
        Log.log(
          `\u203A Detected a change in ${chalk.bold(
            configName
          )}. Restart the server to see the new results.` + (this.settings.additionalWarning || '')
        );
      }
    };

    const watcher = watchFile(filePath, callback ?? listener);

    this.unsubscribe = () => {
      watcher.unref();
    };

    return filePath;
  }
}
