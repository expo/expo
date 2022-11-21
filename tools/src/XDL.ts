import process from 'process';

import * as ExpoCLI from './ExpoCLI';
import * as Log from './Log';

type Options = {
  accessToken?: string;
  userpass?: {
    username: string;
    password: string;
  };
};

/**
 * Uses the installed version of `expo-cli` to publish a project.
 */
export async function publishProjectWithExpoCliAsync(
  projectRoot: string,
  options: Options = {}
): Promise<void> {
  process.env.EXPO_NO_DOCTOR = '1';

  if (options.accessToken) {
    Log.collapsed('Using access token...');
    process.env.EXPO_TOKEN = options.accessToken;
  } else {
    const username = options.userpass?.username || process.env.EXPO_CI_ACCOUNT_USERNAME;
    const password = options.userpass?.password || process.env.EXPO_CI_ACCOUNT_PASSWORD;

    if (username && password) {
      Log.collapsed('Logging in...');
      // TODO: rework this to use EAS update instead of expo publish
      await ExpoCLI.runLegacyExpoCliAsync('login', ['-u', username, '-p', password]);
    } else {
      Log.collapsed('Expo username and password not specified. Using currently logged-in account.');
    }
  }

  Log.collapsed('Publishing...');
  const publishArgs: string[] = [];

  if (process.env.CI) {
    publishArgs.push('--max-workers', '1');
  }

  // TODO: rework this to use EAS update instead of expo publish
  await ExpoCLI.runLegacyExpoCliAsync('publish', publishArgs, {
    cwd: projectRoot,
  });
}
