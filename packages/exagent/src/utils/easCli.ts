// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy — EAS Hosting is the web rail.
// The EAS CLI is reached as a subprocess like the rest of the family (llp/0001 constraint 5), so
// the first question of anything that goes through EAS is which `eas` binary is going to run. A
// web deploy answers it before it exports; every other EAS-backed command answers it the same way,
// which is why the resolver is here and not under `deploy/`.

import path from 'path';

import { fileExistsSync } from './dir';
import { CommandError } from './errors';
import { findExecutableOnPath } from './subprocess';

/** The `eas` bin to spawn, and where it came from. */
export interface EasCli {
  command: string;
  /** `project` for the project's own `eas-cli`, `path` for a globally installed one. */
  source: 'project' | 'path';
}

/**
 * Resolve the `eas` CLI for a project.
 *
 * The project's own `eas-cli` wins, so the version the repository pinned is the version that
 * deploys; a global install is the fallback, because that is how most machines have it.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 * @throws {CommandError} `EAS_CLI_MISSING` when neither exists.
 */
export function resolveEasCliOrThrow(
  projectRoot: string,
  { pathEnv }: { pathEnv?: string } = {}
): EasCli {
  const binName = process.platform === 'win32' ? 'eas.cmd' : 'eas';
  const projectBin = path.join(projectRoot, 'node_modules', '.bin', binName);
  if (fileExistsSync(projectBin)) {
    return { command: projectBin, source: 'project' };
  }

  const pathBin = findExecutableOnPath('eas', { pathEnv });
  if (pathBin) {
    return { command: pathBin, source: 'path' };
  }

  const error = new CommandError(
    'EAS_CLI_MISSING',
    [
      `The EAS CLI is not available, so this project cannot be deployed from here.`,
      `Why: no "eas" binary was found in ${path.join('node_modules', '.bin')} or on PATH, and EAS is what ships an Expo app (hosting for web, EAS Build for native).`,
      `How: install it once with "npm install -g eas-cli", or add it to the project with "npm install --save-dev eas-cli", then run this command again.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install -g eas-cli';
  throw error;
}
