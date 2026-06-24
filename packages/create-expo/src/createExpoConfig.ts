import fs from 'fs';
import path from 'path';

import { Log } from './log';

const debug = require('debug')('expo:init:monorepo-config') as typeof console.log;

export const CREATE_EXPO_CONFIG_NAME = '.create-expo.json';

/**
 * Per-template configuration for customized behavior in `create-expo`.
 * Templates that need any of these knobs can ship a
 * `.create-expo.json` file at the template root; it is read once at
 * project creation time and then deleted from the user's project so it
 * doesn't leak into their repo.
 */
export interface CreateExpoConfig {
  /**
   * Glob patterns (relative to the project root) listing extra files that
   * should be passed through the `HelloWorld` find-and-replace pass during
   * project creation. When present, this REPLACES the default rename config
   * (see Template.ts `defaultRenameConfig`) — useful for monorepo templates
   * that need to reach inside per-app paths like `apps/*\/android/**\/build.gradle`.
   */
  renamePatterns?: string[];
}

/**
 * Read `.create-expo.json` from the project root and immediately
 * delete the file from disk so it doesn't leak into the user's project.
 * Returns the parsed config (or `undefined` if there's no file / it's
 * malformed). This is the "use it once" entry point that template-extraction
 * code paths should call — every downstream consumer takes the parsed
 * object in memory.
 */
export async function consumeMonorepoConfigAsync(
  projectRoot: string
): Promise<CreateExpoConfig | undefined> {
  const config = await loadMonorepoConfigAsync(projectRoot);
  await fs.promises
    .rm(path.join(projectRoot, CREATE_EXPO_CONFIG_NAME), { force: true })
    .catch(() => undefined);
  return config;
}

/**
 * Reads `.create-expo.json` from the project root without touching
 * the file. Returns `undefined` if the file is missing, unreadable, or
 * malformed — a missing file is the common case (single-app templates) and
 * shouldn't warn.
 *
 * Prefer `consumeMonorepoConfigAsync` for the create-expo flow so the
 * template-only config doesn't leak into the user's project. This function
 * stays exported for tests and any other read-only callers.
 */
export async function loadMonorepoConfigAsync(
  projectRoot: string
): Promise<CreateExpoConfig | undefined> {
  const configPath = path.join(projectRoot, CREATE_EXPO_CONFIG_NAME);
  let contents: string;
  try {
    contents = await fs.promises.readFile(configPath, { encoding: 'utf-8' });
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      Log.log(`Could not read ${CREATE_EXPO_CONFIG_NAME}; ignoring: ${error?.message ?? error}`);
    }
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch (error: any) {
    Log.log(
      `${CREATE_EXPO_CONFIG_NAME} could not be parsed as JSON; ignoring: ${error?.message ?? error}`
    );
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    Log.log(`${CREATE_EXPO_CONFIG_NAME} did not parse as a JSON object; ignoring.`);
    return undefined;
  }
  debug(`Loaded ${CREATE_EXPO_CONFIG_NAME}`);
  return parsed as CreateExpoConfig;
}
