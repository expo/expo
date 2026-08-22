// @ref llp/0007-deploy-and-headless.rfc.md §EAS auth for headless agents
// Path A [confirmed — Kudo, 2026-08-22]: Launch acts as the signed-in user. Two credentials exist
// today, and both are read from where the Expo CLI family already keeps them, so `npx expo login`
// is all a user has to do: `EXPO_TOKEN` for a headless machine, and the session `expo login` writes
// into `~/.expo/state.json`.
//
// Ported from the reference implementation, `create-launch` (src/services/expo/settings.ts): same
// file, same precedence, same environment overrides.

import fs from 'fs';
import os from 'os';
import path from 'path';

import { CommandError } from '../utils/errors';

/** The credential a Launch request is made with. */
export type LaunchAuth =
  /** A personal access token from expo.dev, provisioned for a machine. */
  | { type: 'token'; value: string }
  /** The session `expo login` stored on this machine. */
  | { type: 'session'; value: string };

/** The shape of `state.json` this reads. Everything else in that file belongs to other tools. */
interface ExpoState {
  auth?: { sessionSecret?: string; username?: string };
}

/**
 * The state file the Expo CLI family keeps the session in.
 *
 * The environment overrides exist so a test (and a staging user) can point at another home without
 * touching the real one.
 */
export function expoStateFilePath(): string {
  const override = process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
  if (override) {
    return path.join(override, 'state.json');
  }
  if (isEnabled(process.env.EXPO_STAGING)) {
    return path.join(os.homedir(), '.expo-staging', 'state.json');
  }
  if (isEnabled(process.env.EXPO_LOCAL)) {
    return path.join(os.homedir(), '.expo-local', 'state.json');
  }
  return path.join(os.homedir(), '.expo', 'state.json');
}

/**
 * The credential to launch with, or null when this machine has none.
 *
 * `EXPO_TOKEN` wins: it is what a CI job or a cloud agent is given, and it has to override whatever
 * session happens to be on the disk of that machine.
 */
export async function resolveLaunchAuthAsync(): Promise<LaunchAuth | null> {
  const token = process.env.EXPO_TOKEN;
  if (token) {
    return { type: 'token', value: token };
  }

  let state: ExpoState | null;
  try {
    state = JSON.parse(await fs.promises.readFile(expoStateFilePath(), 'utf8'));
  } catch {
    // No state file, or one this version cannot read: either way, nobody is logged in as far as
    // this command is concerned. It never writes the file, so a broken one is not its problem.
    return null;
  }

  const sessionSecret = state?.auth?.sessionSecret;
  return sessionSecret ? { type: 'session', value: sessionSecret } : null;
}

/**
 * The credential to launch with, or the command that gets one.
 *
 * @throws {CommandError} `LAUNCH_NOT_AUTHENTICATED` when this machine has no credential. There is
 * no interactive fallback on purpose: this command runs with no TTY (llp/0006 §Non-interactive
 * parity), so a login prompt would be an EOF failure instead of a login.
 */
export async function resolveLaunchAuthOrThrowAsync(): Promise<LaunchAuth> {
  const auth = await resolveLaunchAuthAsync();
  if (auth) {
    return auth;
  }

  const error = new CommandError(
    'LAUNCH_NOT_AUTHENTICATED',
    [
      `Launch needs an Expo account, and this machine is not signed in to one.`,
      `Why: the upload is made as you — no session was found in ${expoStateFilePath()}, and EXPO_TOKEN is not set.`,
      `How: run "npx expo login" once on this machine, or set EXPO_TOKEN to a personal access token from https://expo.dev/settings/access-tokens for a machine that cannot sign in interactively.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx expo login';
  throw error;
}

function isEnabled(value: string | undefined): boolean {
  return value === '1' || value?.toLowerCase() === 'true';
}
