// @ref llp/0009-smart-followups.rfc.md §Examples per command — the escalation ladder needs to
// know whether EAS is configured, and that is a file on disk. Nothing here spawns a subprocess:
// asking `eas` would need a login and a network round trip, which a follow-up must never cost.

import fs from 'fs';
import path from 'path';

import { fileExistsSync } from '../utils/dir';

/**
 * Whether the project has an `eas.json`, i.e. EAS Build is configured for it.
 *
 * `eas build` fails without one, so this decides between offering the build and offering the
 * configuration step that has to come first.
 *
 * Synchronous by design: `@expo/agent-cli start` computes its follow-ups on the last line before the dev
 * server takes over the terminal, and one `stat` there must not reorder anything.
 */
export function easJsonExistsSync(projectRoot: string): boolean {
  return fileExistsSync(path.join(projectRoot, 'eas.json'));
}

/**
 * Whether the project declares `expo-dev-client`, i.e. it builds its own runtime instead of
 * running in Expo Go.
 *
 * This is the rule `expo start` itself applies when no `--go` or `--dev-client` flag is given, so
 * the follow-up names the URL shape the dev server will actually serve. The plain `@expo/agent-cli start`
 * wrapper runs no project probe by design, and this is one synchronous file read, so it can.
 * Declared rather than installed: a project that lists the dependency is not going to be opened in
 * Expo Go, whether `node_modules` is populated yet or not.
 */
export function dependsOnDevClientSync(projectRoot: string): boolean {
  let packageJson: { dependencies?: object; devDependencies?: object };
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    // No readable `package.json` is not this module's problem to report: the Expo CLI the caller
    // is about to spawn says so much better than a follow-up could.
    return false;
  }

  return (
    'expo-dev-client' in (packageJson.dependencies ?? {}) ||
    'expo-dev-client' in (packageJson.devDependencies ?? {})
  );
}
