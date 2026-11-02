import { vol } from 'memfs';
import process from 'node:process';

import { getOriginalEnv, getOriginalEnvValue, parseEnvFiles } from '../';
import type { EnvOutput } from '../parse';

const originalEnv = process.env;
const originalPlatform = process.platform;

beforeEach(() => {
  process.env = { NODE_ENV: 'development' };
  vol.reset();
  Object.defineProperty(process, 'platform', { value: 'win32' });
});

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform });
  process.env = originalEnv;
});

it('matches backups when a Windows dotenv key is read or enumerated with different casing', () => {
  const env: EnvOutput = {};
  vol.fromJSON({ '.env.local': 'android_home=/dotenv' }, '/');
  parseEnvFiles(['/.env.local'], { systemEnv: env });
  env.ANDROID_HOME = '/dotenv';
  expect(getOriginalEnvValue('ANDROID_HOME', env)).toBeUndefined();
  expect(getOriginalEnv(env)).toEqual({});
});

it('preserves the first Windows backup across reloads with different key casing', () => {
  const env = { android_home: '/shell' };
  vol.fromJSON({ '.env.local': 'android_home=/first' }, '/');
  parseEnvFiles(['/.env.local'], { systemEnv: env });
  env.android_home = '/changed';
  vol.fromJSON({ '.env.local': 'ANDROID_HOME=/second' }, '/');
  parseEnvFiles(['/.env.local'], { systemEnv: env });
  expect(getOriginalEnvValue('ANDROID_HOME', env)).toBe('/shell');
  expect(getOriginalEnv(env)).toEqual({ android_home: '/shell' });
});
