import { vol } from 'memfs';
import process from 'node:process';

import { getOriginalEnv, getOriginalEnvValue, loadEnvFiles, parseEnvFiles } from '../';
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

it('matches inherited dotenv names case-insensitively only on Windows', () => {
  for (const platform of ['linux', 'darwin', 'win32']) {
    Object.defineProperty(process, 'platform', { value: platform });
    const env = {
      EXPO_OVERRIDE_METRO_CONFIG: './project-controlled.js',
      __EXPO_ENV_LOADED: JSON.stringify(['expo_override_metro_config']),
    };
    expect(getOriginalEnvValue('EXPO_OVERRIDE_METRO_CONFIG', env)).toBe(
      platform === 'win32' ? undefined : './project-controlled.js'
    );
    expect(getOriginalEnv(env)).toEqual(
      platform === 'win32' ? {} : { EXPO_OVERRIDE_METRO_CONFIG: './project-controlled.js' }
    );
  }
});

it('never exposes a mixed-case Windows loaded marker', () => {
  const env = { __expo_env_loaded: '[]' };
  expect(getOriginalEnvValue('__expo_env_loaded', env)).toBeUndefined();
});

it('reads mixed-case Windows markers and removes all aliases from a cloned environment', () => {
  const env = {
    __expo_env_loaded: JSON.stringify(['tool_root']),
    TOOL_ROOT: '/dotenv',
    Tool_Root: '/dotenv-alias',
    UNTOUCHED: 'shell',
  };
  expect(getOriginalEnvValue('TOOL_ROOT', env)).toBeUndefined();
  expect(getOriginalEnvValue('__expo_env_loaded', env)).toBeUndefined();
  expect(getOriginalEnv(env)).toEqual({ UNTOUCHED: 'shell' });
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

it('uses the original mixed-case Windows marker after a forced load', () => {
  const env = {
    TOOL_ROOT: '/parent-dotenv',
    __expo_env_loaded: JSON.stringify(['tool_root']),
  };
  vol.fromJSON({ '.env': 'NEW_VALUE=child' }, '/');
  loadEnvFiles(['/.env'], { force: true, systemEnv: env });
  expect(getOriginalEnvValue('TOOL_ROOT', env)).toBeUndefined();
  expect(getOriginalEnv(env)).toEqual({});
});

it('preserves mixed-case Windows unsafe opt-ins when removing inherited dotenv values', () => {
  process.env.EXPO_UNSAFE_DOTENV_KEYS = 'Tool_Root';
  jest.isolateModules(() => {
    const mod = require('../');
    const env = {
      tool_root: '/allowed',
      OTHER: '/dotenv',
      __expo_env_loaded: JSON.stringify(['TOOL_ROOT', 'other']),
    };
    expect(mod.getOriginalEnvValue('TOOL_ROOT', env)).toBe('/allowed');
    expect(mod.getOriginalEnv(env)).toEqual({ tool_root: '/allowed' });
  });
});
