import assert from 'assert';
import chalk from 'chalk';

import * as Log from '../../log';
import { ApiV2Error, CommandError } from '../errors';
import { learnMore } from '../link';
import promptAsync, { Question } from '../prompts';
import { retryUsernamePasswordAuthWithOTPAsync } from './otp';
import { Actor, getUserAsync, loginAsync } from './user';

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
} = {}): Promise<void> {
  const hasCredentials = options.username && options.password;

  if (printNewLine) {
    Log.log();
  }

  Log.log(hasCredentials ? 'Logging in to EAS' : 'Log in to EAS');

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
    username = resolved.username ?? options.username;
    password = resolved.password ?? options.password;
  }

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
  let user: Actor | undefined;
  try {
    user = await getUserAsync();
  } catch {}

  if (!user) {
    Log.warn(chalk.yellow`An Expo user account is required to proceed.`);
    await showLoginPromptAsync({ printNewLine: true });
    user = await getUserAsync();
  }

  assert(user, 'User should be logged in');
  return user;
}

export function ensureActorHasUsername(user: Actor): string {
  if (user.__typename === 'User') {
    return user.username;
  }
  throw new CommandError('This action is not supported for robot users.');
}
