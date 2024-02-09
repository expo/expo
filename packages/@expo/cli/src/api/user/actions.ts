import assert from 'assert';
import chalk from 'chalk';

import { retryUsernamePasswordAuthWithOTPAsync } from './otp';
import { Actor, getUserAsync, loginAsync, ssoLoginAsync } from './user';
import * as Log from '../../log';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import promptAsync, { Question } from '../../utils/prompts';
import { ApiV2Error } from '../rest/client';

/** Show login prompt while prompting for missing credentials. */
export async function showLoginPromptAsync({
  printNewLine = false,
  otp,
  ...options
}: {
  printNewLine?: boolean;
  username?: string;
  password?: string;
  otp?: string;
  sso?: boolean | undefined;
} = {}): Promise<void> {
  if (env.EXPO_OFFLINE) {
    throw new CommandError('OFFLINE', 'Cannot authenticate in offline-mode');
  }
  const hasCredentials = options.username && options.password;
  const sso = options.sso;

  if (printNewLine) {
    Log.log();
  }

  if (sso) {
    await ssoLoginAsync();
    return;
  }

  Log.log(
    hasCredentials
      ? `Logging in to EAS with email or username (exit and run 'npx expo login' for other options)`
      : `Log in to EAS with email or username (exit and run 'npx expo login' for other options)`
  );

  let username = options.username;
  let password = options.password;

  if (!hasCredentials) {
    const resolved = await promptAsync(
      [
        !options.username && {
          type: 'text',
          name: 'username',
          message: 'Email or username',
        },
        !options.password && {
          type: 'password',
          name: 'password',
          message: 'Password',
        },
      ].filter(Boolean) as Question<string>[],
      {
        nonInteractiveHelp: `Use the EXPO_TOKEN environment variable to authenticate in CI (${learnMore(
          'https://docs.expo.dev/accounts/programmatic-access/'
        )})`,
      }
    );
    username ??= resolved.username;
    password ??= resolved.password;
  }
  // This is just for the types.
  assert(username && password);

  try {
    await loginAsync({
      username,
      password,
      otp,
    });
  } catch (e) {
    if (e instanceof ApiV2Error && e.expoApiV2ErrorCode === 'ONE_TIME_PASSWORD_REQUIRED') {
      await retryUsernamePasswordAuthWithOTPAsync(
        username,
        password,
        e.expoApiV2ErrorMetadata as any
      );
    } else {
      throw e;
    }
  }
}

/** Ensure the user is logged in, if not, prompt to login. */
export async function ensureLoggedInAsync(): Promise<Actor> {
  let user = await getUserAsync().catch(() => null);

  if (!user) {
    Log.warn(chalk.yellow`An Expo user account is required to proceed.`);
    await showLoginPromptAsync({ printNewLine: true });
    user = await getUserAsync();
  }

  assert(user, 'User should be logged in');
  return user;
}
