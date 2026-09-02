// @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
// The second wrong-directory failure, and the one `NO_PROJECT` cannot catch: there *is* a
// package.json here, it is just not an app. Everything in this file reads one file synchronously,
// because it runs at the top of a command — before the probe, before the plan, before anything is
// spawned — and a command that must not act on this directory must not do work here first.
import fs from 'fs';
import path from 'path';

import { PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import { findUpProjectRootOrAssert } from '../utils/findUp';

/** The command that creates an app, named on the `Try:` line and in the `How:` sentence. */
const NEW_APP_COMMAND = `${PROGRAM_PREFIX} new my-app`;

/**
 * Whether the package at this root declares `expo` as a dependency.
 *
 * Declared, not installed. See `ProjectState.isExpoApp` for why: a fresh clone has no
 * `node_modules` and is still an Expo app, and the two questions have two fields.
 *
 * An unreadable or malformed `package.json` answers `false` — nothing there declares `expo`, and
 * this is a guard rather than a diagnosis.
 */
export function declaresExpoSync(projectRoot: string): boolean {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return packageJson?.dependencies?.expo != null || packageJson?.devDependencies?.expo != null;
  } catch {
    return false;
  }
}

/**
 * Stop a command that acts on the app when this directory holds no app to act on.
 *
 * What / Why / How, per the repo's error style, because all three are things the caller does not
 * know: *what* is wrong is a fact about a file they did not look at, *why* is almost always a
 * command run one directory too high, and *how* has three answers depending on which of those they
 * meant. The `Try:` line names the safe one — creating an app changes nothing that is already here,
 * where adding Expo to this package is exactly the mutation this guard exists to prevent.
 *
 * Exit code: the default `EXIT_ERROR` band, the same as `NO_PROJECT`. The tool did not work,
 * the call was aimed at the wrong directory, and running it again unchanged does the same thing.
 */
export function assertExpoAppSync(projectRoot: string): void {
  if (declaresExpoSync(projectRoot)) {
    return;
  }
  const error = new CommandError(
    'NOT_EXPO_APP',
    [
      `This directory is not an Expo app, so this command has nothing to act on.`,
      `Why: ${path.join(projectRoot, 'package.json')} declares no "expo" dependency, which is what makes a package an Expo app. The likeliest cause is a command run one directory too high — a repository or workspace root above the app.`,
      `How: change to the app's own directory and run this again; create an app here with "${NEW_APP_COMMAND}"; or, if you really mean to add Expo to this package, run "${PROGRAM_PREFIX} install expo" first.`,
    ].join('\n')
  );
  error.suggestedCommand = NEW_APP_COMMAND;
  throw error;
}

/**
 * The project root of an Expo app, or a stop naming which of the two things is missing.
 *
 * The one line a command that acts on the app runs instead of `findUpProjectRootOrAssert`: the
 * walk answers "is there a project here", and this answers "is that project this CLI's subject".
 */
export function findUpExpoAppRootOrAssert(cwd: string): string {
  const projectRoot = findUpProjectRootOrAssert(cwd);
  assertExpoAppSync(projectRoot);
  return projectRoot;
}
