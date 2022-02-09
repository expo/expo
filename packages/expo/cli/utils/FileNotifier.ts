import chalk from 'chalk';
import { watchFile } from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import * as Log from '../log';

export class FileNotifier {
  constructor(private projectRoot: string, private moduleIds: string[]) {}
  // List of files that are being observed.
  private watchingFiles: string[] = [];

  /** Get the file in the project. */
  private resolveFilePath(): string | undefined {
    for (const moduleId of this.moduleIds) {
      const filePath = resolveFrom.silent(this.projectRoot, moduleId);
      if (filePath) {
        return filePath;
      }
    }
    return undefined;
  }

  public startObserving() {
    const configPath = this.resolveFilePath();
    if (configPath) {
      return this.watchFile(configPath);
    }
    return configPath;
  }

  /** Watch the file and warn to reload the CLI if it changes. */
  watchFile(filePath: string): void {
    if (this.watchingFiles.includes(filePath)) {
      return;
    }

    this.watchingFiles.push(filePath);
    const configName = path.relative(this.projectRoot, filePath);
    watchFile(filePath, (cur: any, prev: any) => {
      if (prev.size || cur.size) {
        Log.log(
          `\u203A Detected a change in ${chalk.bold(
            configName
          )}. Restart the server to see the new results.`
        );
      }
    });
  }
}
