import chalk from 'chalk';
import { watchFile } from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import * as Log from '../log';

// List of files that are being observed.
const watchingFiles: string[] = [];

/** Get the babel configuration file for the project. */
function getProjectBabelConfigFile(projectRoot: string): string | undefined {
  return (
    resolveFrom.silent(projectRoot, './babel.config.js') ||
    resolveFrom.silent(projectRoot, './.babelrc') ||
    resolveFrom.silent(projectRoot, './.babelrc.js')
  );
}

export function watchBabelConfigForProject(projectRoot: string) {
  const configPath = getProjectBabelConfigFile(projectRoot);
  if (configPath) {
    return watchBabelConfig(projectRoot, configPath);
  }
  return configPath;
}

/** Watch the babel configuration file and warn to reload the CLI if it changes. */
function watchBabelConfig(projectRoot: string, configPath: string): void {
  if (watchingFiles.includes(configPath)) {
    return;
  }

  watchingFiles.push(configPath);
  const configName = path.relative(projectRoot, configPath);
  watchFile(configPath, (cur: any, prev: any) => {
    if (prev.size || cur.size) {
      Log.log(
        `\u203A Detected a change in ${chalk.bold(
          configName
        )}. Restart the server to see the new results.`
      );
    }
  });
}
