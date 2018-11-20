import process from 'process';

import * as ExpoCLI from './ExpoCLI';
import * as Log from './Log';

/**
 * Uses the installed version of `expo-cli` to publish a project.
 */
export async function publishProjectWithExpoCliAsync(
  projectRoot: string,
  options: {
    useUnversioned: boolean;
    userpass?: { username: string; password: string };
  } = {
    useUnversioned: true,
  }
): Promise<void> {
  process.env.EXPO_NO_DOCTOR = '1';

  const username =
    (options.userpass && options.userpass.username) || process.env.EXPO_CI_ACCOUNT_USERNAME;
  const password =
    (options.userpass && options.userpass.password) || process.env.EXPO_CI_ACCOUNT_PASSWORD;

  if (username && password) {
    Log.collapsed('Logging in...');
    await ExpoCLI.runExpoCliAsync('login', ['-u', username, '-p', password], {
      root: projectRoot,
      useUnversioned: options.useUnversioned,
    });
  } else {
    Log.collapsed('Expo username and password not specified. Using currently logged-in account.');
  }

  Log.collapsed('Publishing...');
  const publishArgs: string[] = [];

  if (process.env.CI) {
    publishArgs.push('--max-workers', '1');
  }

  await ExpoCLI.runExpoCliAsync('publish', publishArgs, {
    root: projectRoot,
    useUnversioned: options.useUnversioned,
  });
}
