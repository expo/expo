import spawnAsync from '@expo/spawn-async';
import process from 'process';

import { EXPO_DIR } from './Constants';
import * as EASCLI from './EASCLI';
import * as Log from './Log';

type Options = {
  accessToken?: string;
  userpass?: {
    username: string;
    password: string;
  };
  branch: string;
  message: string;
};

/**
 * Uses the installed version of `eas-cli` to publish a project.
 */
export async function setAuthAndPublishProjectWithEasCliAsync(
  projectRoot: string,
  options: Options
): Promise<{ createdUpdateGroupId: string }> {
  process.env.EXPO_NO_DOCTOR = '1';

  if (options.accessToken) {
    Log.collapsed('Using access token...');
    process.env.EXPO_TOKEN = options.accessToken;
  } else {
    const username = options.userpass?.username || process.env.EXPO_CI_ACCOUNT_USERNAME;
    const password = options.userpass?.password || process.env.EXPO_CI_ACCOUNT_PASSWORD;

    if (username && password) {
      Log.collapsed('Logging in...');
      // Pass the password via stdin instead of argv to keep it out of the process table.
      const child = spawnAsync('npx', ['expo', 'login', '-u', username, '-p', '-'], {
        cwd: EXPO_DIR,
        stdio: ['pipe', 'inherit', 'inherit'],
        env: { ...process.env, EXPO_NO_DOCTOR: 'true' },
      });
      child.child.stdin!.end(`${password}\n`);
      await child;
    } else {
      Log.collapsed('Expo username and password not specified. Using currently logged-in account.');
    }
  }

  return await publishProjectWithEasCliAsync(projectRoot, options);
}

export async function publishProjectWithEasCliAsync(
  projectRoot: string,
  options: {
    branch: string;
    message: string;
  }
): Promise<{ createdUpdateGroupId: string }> {
  Log.collapsed('Publishing...');
  const publishedUpdatesJSONString = await EASCLI.runEASCliAsync(
    'update',
    ['--non-interactive', '--json', '--branch', options.branch, '--message', options.message],
    {
      cwd: projectRoot,
    }
  );

  const publishedUpdates = JSON.parse(publishedUpdatesJSONString);
  return { createdUpdateGroupId: publishedUpdates[0].group };
}
