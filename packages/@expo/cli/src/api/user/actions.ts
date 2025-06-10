import assert from 'assert';
import chalk from 'chalk';

import { retryUsernamePasswordAuthWithOTPAsync } from './otp';
import { Actor, getUserAsync, loginAsync, ssoLoginAsync } from './user';
import * as Log from '../../log';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import promptAsync, { confirmAsync, Question, selectAsync } from '../../utils/prompts';
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
      ? `Logging in to EAS with email or username (exit and run 'npx expo login --help' for other login options)`
      : `Log in to EAS with email or username (exit and run 'npx expo login --help' for other login options)`
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

export async function tryGetUserAsync(): Promise<Actor | null> {
  const user = await getUserAsync().catch(() => null);

  if (user) {
    return user;
  }

  const choices = [
    {
      title: 'Log in',
      value: true,
    },
    {
      title: 'Proceed anonymously',
      value: false,
    },
  ];

  const value = await selectAsync(
    chalk`\n\nIt is recommended to log in with your Expo account before proceeding. \n{dim ${learnMore(
      'https://expo.fyi/unverified-app-expo-go'
    )}}\n`,
    choices,
    {
      nonInteractiveHelp: `Use the EXPO_TOKEN environment variable to authenticate in CI (${learnMore(
        'https://docs.expo.dev/accounts/programmatic-access/'
      )})`,
    }
  );

  if (value) {
    await showLoginPromptAsync({ printNewLine: true });
    return (await getUserAsync()) ?? null;
  }

  return null;
}
