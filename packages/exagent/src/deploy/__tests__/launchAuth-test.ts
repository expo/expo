import { vol } from 'memfs';

import { CommandError } from '../../utils/errors';
import { resolveLaunchAuthAsync, resolveLaunchAuthOrThrowAsync } from '../launchAuth';

/** Environment variables these tests set, restored between them. */
const OWNED_ENV = ['EXPO_TOKEN', 'EXPO_STAGING', 'EXPO_LOCAL', '__UNSAFE_EXPO_HOME_DIRECTORY'];
const realEnv = new Map(OWNED_ENV.map((name) => [name, process.env[name]]));

beforeEach(() => {
  // The machine running the tests may be logged in, and that must not decide the result.
  for (const name of OWNED_ENV) {
    delete process.env[name];
  }
});

afterEach(() => {
  for (const [name, value] of realEnv) {
    if (value == null) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
  vol.reset();
});

/** Write the state file `expo login` leaves behind. */
function writeSession(sessionSecret: string, directory = '/home/.expo') {
  vol.fromJSON({
    [`${directory}/state.json`]: JSON.stringify({
      auth: { sessionSecret, userId: 'user-1', username: 'ada' },
    }),
  });
}

describe(resolveLaunchAuthAsync, () => {
  it(`should read the session of a logged in user`, async () => {
    writeSession('session-secret-value');

    await expect(resolveLaunchAuthAsync()).resolves.toEqual({
      type: 'session',
      value: 'session-secret-value',
    });
  });

  it(`should prefer EXPO_TOKEN over a stored session`, async () => {
    // A token is what a headless machine is given, so it wins over whatever is on disk.
    writeSession('session-secret-value');
    process.env.EXPO_TOKEN = 'token-value';

    await expect(resolveLaunchAuthAsync()).resolves.toEqual({
      type: 'token',
      value: 'token-value',
    });
  });

  it(`should ignore an empty EXPO_TOKEN`, async () => {
    writeSession('session-secret-value');
    process.env.EXPO_TOKEN = '';

    await expect(resolveLaunchAuthAsync()).resolves.toMatchObject({ type: 'session' });
  });

  it(`should report no auth when nothing is stored`, async () => {
    await expect(resolveLaunchAuthAsync()).resolves.toBeNull();
  });

  it(`should report no auth for a state file without a session`, async () => {
    vol.fromJSON({ '/home/.expo/state.json': JSON.stringify({ uuid: 'anonymous' }) });

    await expect(resolveLaunchAuthAsync()).resolves.toBeNull();
  });

  it(`should report no auth for an unreadable state file instead of throwing`, async () => {
    vol.fromJSON({ '/home/.expo/state.json': 'not json' });

    await expect(resolveLaunchAuthAsync()).resolves.toBeNull();
  });

  it(`should read the state file of the staging environment`, async () => {
    writeSession('staging-secret', '/home/.expo-staging');
    process.env.EXPO_STAGING = '1';

    await expect(resolveLaunchAuthAsync()).resolves.toEqual({
      type: 'session',
      value: 'staging-secret',
    });
  });

  it(`should honor the home directory override`, async () => {
    writeSession('other-secret', '/tmp/fake-home');
    process.env.__UNSAFE_EXPO_HOME_DIRECTORY = '/tmp/fake-home';

    await expect(resolveLaunchAuthAsync()).resolves.toEqual({
      type: 'session',
      value: 'other-secret',
    });
  });
});

describe(resolveLaunchAuthOrThrowAsync, () => {
  it(`should return the auth of a logged in user`, async () => {
    writeSession('session-secret-value');

    await expect(resolveLaunchAuthOrThrowAsync()).resolves.toMatchObject({ type: 'session' });
  });

  it(`should answer a missing login with the command that fixes it`, async () => {
    expect.assertions(4);
    try {
      await resolveLaunchAuthOrThrowAsync();
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('LAUNCH_NOT_AUTHENTICATED');
      // Errors are prompts (llp/0006): both ways to authenticate are named.
      expect(error.suggestedCommand).toBe('npx expo login');
      expect(error.message).toContain('EXPO_TOKEN');
    }
  });
});
