// @ref llp/0015-backend-selection-and-config.rfc.md §Where the config lives
// One `package.json` read, one key. Synchronous and cached per process, because every surface that
// wants it — the plan engine, `status`, `impact`'s follow-ups — wants it before it does anything
// else, and none of them may pay a promise for four scalars.

import fs from 'fs';
import path from 'path';

import { CommandError } from '../utils/errors';
import { parseAgentCliSettings } from './parse';
import { NO_SETTINGS, type LoadedSettings } from './types';

/**
 * Where the config lives.
 *
 * `package.json` › `expo` › `@expo/agent-cli`, which is where this repository already keeps every other
 * piece of *tooling* configuration: `expo.install.exclude` (the Expo CLI's installer),
 * `expo.doctor` (expo-doctor) and `expo.autolinking` (expo-modules-autolinking) are all read from
 * exactly here [observed — `packages/@expo/cli/src/install/checkPackages.ts`,
 * `packages/expo-doctor/src/utils/doctorConfig.ts`,
 * `packages/expo-modules-autolinking/src/commands/autolinkingOptions.ts`]. See llp/0015 for the two
 * places this deliberately is *not*.
 */
export const CONFIG_FILE_NAME = 'package.json';

/** The key path inside that file, as a reader would type it. */
export const CONFIG_KEY_PATH = 'expo.agentCli';

/** How an error names the location. */
export const CONFIG_LOCATION = `"${CONFIG_KEY_PATH}" in ${CONFIG_FILE_NAME}`;

/** One read per project per process. Nothing here changes while a command runs. */
const cache = new Map<string, LoadedSettings>();

/** Forget what this process read. For tests, and for nothing else. */
export function resetSettingsCache(): void {
  cache.clear();
}

/**
 * Read the developer's config for a project.
 *
 * A project without the key gets {@link NO_SETTINGS}, which is not an error: saying nothing is the
 * default and is by far the common case. A `package.json` that cannot be read at all is also not
 * an error here — every command that needs `package.json` for its own reasons reports that in its
 * own words, and a preference file is not the place to discover it.
 *
 * @throws {CommandError} `BAD_AGENT_CLI_CONFIG` when the key exists and says something invalid. That
 * one *is* fatal: the developer wrote it down to change what happens, so carrying on as though
 * they had not is the failure this refuses to commit.
 */
export function readAgentCliSettings(projectRoot: string): LoadedSettings {
  const cached = cache.get(projectRoot);
  if (cached) {
    return cached;
  }
  const loaded = load(projectRoot);
  cache.set(projectRoot, loaded);
  return loaded;
}

function load(projectRoot: string): LoadedSettings {
  const file = path.join(projectRoot, CONFIG_FILE_NAME);
  let contents: string;
  try {
    contents = fs.readFileSync(file, 'utf8');
  } catch {
    return NO_SETTINGS;
  }

  let packageJson: unknown;
  try {
    packageJson = JSON.parse(contents);
  } catch (error: any) {
    // Refused rather than skipped, because the key may be in there: a `package.json` this CLI
    // cannot parse is a `package.json` whose preferences it cannot honour, and pretending none
    // were written is the silent-drop failure again.
    throw new CommandError(
      'BAD_AGENT_CLI_CONFIG',
      [
        `${file} is not valid JSON, so ${CONFIG_LOCATION} could not be read: ${error?.message ?? String(error)}`,
        `Why: this CLI reads its own settings out of that file, and a file it cannot parse may hold settings it is about to ignore.`,
        `How: fix the JSON — the message above names the position — and run this command again.`,
      ].join('\n')
    );
  }

  const expo = (packageJson as any)?.expo;
  const raw = expo == null ? undefined : (expo as any)?.agentCli;
  if (raw == null) {
    return NO_SETTINGS;
  }

  return {
    settings: parseAgentCliSettings(raw, CONFIG_LOCATION),
    file,
    keyPath: CONFIG_KEY_PATH,
  };
}
