import path from 'node:path';

import { getTelemetry } from '..';

jest.mock('../../../api/user/user');

beforeEach(() => setEnv('EXPO_NO_TELEMETRY', undefined));
afterEach(() => resetEnv());

it('returns telemetry with detached strategy by default', () => {
  jest.isolateModules(() => {
    const { getTelemetry } = require('../') as typeof import('../');
    expect(getTelemetry()?.strategy).toBe('detached');
  });
});

it('returns non-detached client when `env.EXPO_NO_TELEMETRY_DETACH` is true', () => {
  setEnv('EXPO_NO_TELEMETRY_DETACH', 'true');
  jest.isolateModules(() => {
    const { getTelemetry } = require('../') as typeof import('../');
    expect(getTelemetry()?.strategy).toBe('instant');
  });
});

it('returns singleton client', () => {
  expect(getTelemetry()).toBe(getTelemetry());
});

it('returns `null` when `env.EXPO_NO_TELEMETRY` is true', () => {
  setEnv('EXPO_NO_TELEMETRY', 'true');
  expect(getTelemetry()).toBeNull();
});

it('returns `null` when `env.EXPO_OFFLINE` is true', () => {
  setEnv('EXPO_OFFLINE', 'true');
  expect(getTelemetry()).toBeNull();
});

it('uses the stored session user ID without fetching the user', () => {
  setEnv('EXPO_TOKEN', undefined);
  jest.isolateModules(() => {
    const fs = require('fs') as typeof import('fs');
    const { getSettingsFilePath } = require('../../../api/user/UserSettings');
    fs.mkdirSync(path.dirname(getSettingsFilePath()), { recursive: true });
    fs.writeFileSync(
      getSettingsFilePath(),
      JSON.stringify({ auth: { sessionSecret: 'secret', userId: 'user-id' } })
    );

    const { getTelemetry } = require('../') as typeof import('../');
    const { getUserAsync } = require('../../../api/user/user');

    expect(getTelemetry()?.isInitialized).toBe(true);
    expect(getUserAsync).not.toHaveBeenCalled();
  });
});

const envOriginal: Record<string, string | undefined> = {};

function setEnv(key: string, value?: string) {
  if (!(key in envOriginal)) {
    envOriginal[key] = process.env[key];
  }

  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function resetEnv() {
  for (const key in envOriginal) {
    if (envOriginal[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = envOriginal[key];
    }

    delete envOriginal[key];
  }
}
