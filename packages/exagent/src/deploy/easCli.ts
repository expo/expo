// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy — "EAS is the delivery rail".
// EAS is reached as a subprocess like the rest of the family (llp/0001 constraint 5), so the first
// question of every deploy is which `eas` binary is going to run, and the second is whether the
// project is configured for it. Both are answered before anything is spent.

import path from 'path';

import { easJsonExistsSync } from '../followups/projectFiles';
import { fileExistsSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { findExecutableOnPath } from '../utils/subprocess';

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

/**
 * Assert that the project is configured for EAS Build.
 *
 * Checked before the build is started, not by letting `eas build` discover it: a missing `eas.json`
 * has one exact fix, and naming it here is one hop instead of a search.
 *
 * @throws {CommandError} `EAS_NOT_CONFIGURED` when the project has no `eas.json`.
 */
export function assertEasConfiguredOrThrow(projectRoot: string): void {
  if (easJsonExistsSync(projectRoot)) {
    return;
  }

  const error = new CommandError(
    'EAS_NOT_CONFIGURED',
    [
      `This project has no eas.json, so there is no build profile to build with.`,
      `Why: EAS Build reads the platform settings and the profile (production, preview, ...) from eas.json, and the project root does not have one.`,
      `How: run "npx eas-cli build:configure" once to create it, then run this command again.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx eas-cli build:configure';
  throw error;
}
