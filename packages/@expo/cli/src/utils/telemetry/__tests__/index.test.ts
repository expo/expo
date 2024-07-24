import { getTelemetry } from '..';

beforeEach(() => setEnv('EXPO_NO_TELEMETRY', undefined));
afterEach(() => resetEnv());

it('returns detached client by default', () => {
  jest.isolateModules(() => {
    const { getTelemetry } = require('../') as typeof import('../');
    const { DetachedClient } = require('../DetachedClient') as typeof import('../DetachedClient');
    expect(getTelemetry()).toBeInstanceOf(DetachedClient);
  });
});

it('returns non-detached client when `env.EXPO_NO_TELEMETRY_DETACH` is true', () => {
  setEnv('EXPO_NO_TELEMETRY_DETACH', 'true');
  jest.isolateModules(() => {
    const { getTelemetry } = require('../') as typeof import('../');
    const { RudderClient } = require('../RudderClient') as typeof import('../RudderClient');
    expect(getTelemetry()).toBeInstanceOf(RudderClient);
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
