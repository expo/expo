import os from 'node:os';
import process from 'node:process';

import { isIgnoredEnvKey, isLocalEnvKey } from '../constants';

const originalEnv = process.env;

beforeEach(() => {
  process.env = {};
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe('env key case normalization', () => {
  it.each([
    'npm_config_registry',
    'Npm_Config_Registry',
    'node_options',
    'ld_preload',
    'systemroot',
    'sYsTeMrOoT',
    '__expo_config_mode',
    '__expo_env_loaded',
    'expo_no_dotenv',
    'expo_unsafe_dotenv_keys',
  ])('blocks %s', (key) => expect(isIgnoredEnvKey(key)).toBe(true));

  it.each(['android_home', 'Android_Home', 'Http_Proxy', 'hTtPs_PrOxY', 'Java_Home'])(
    'restricts %s to local files',
    (key) => expect(isLocalEnvKey(key)).toBe(true)
  );

  it.each([
    ['darwin', 'dyld_custom_hook'],
    ['darwin', 'DyLd_Custom_Hook'],
    ['linux', 'ld_custom_hook'],
    ['linux', 'Ld_Custom_Hook'],
  ] as const)('blocks %s loader prefix %s even with an unsafe opt-in', (platform, key) => {
    process.env.EXPO_UNSAFE_DOTENV_KEYS = key;
    jest.spyOn(os, 'platform').mockReturnValue(platform);
    jest.isolateModules(() => {
      expect(require('../constants').isIgnoredEnvKey(key)).toBe(true);
    });
  });

  it.each([
    ['npm_config_registry', 'NPM_CONFIG_REGISTRY'],
    ['NPM_CONFIG_REGISTRY', 'Npm_Config_Registry'],
    ['android_home', 'ANDROID_HOME'],
    ['ANDROID_HOME', 'Android_Home'],
  ])('matches unsafe opt-in %s to %s', (allowed, key) => {
    process.env.EXPO_UNSAFE_DOTENV_KEYS = allowed;
    jest.isolateModules(() => {
      const constants = require('../constants');
      expect(constants.isUnsafeAllowedEnvKey(key)).toBe(true);
      expect(constants.isIgnoredEnvKey(key)).toBe(false);
      expect(constants.isLocalEnvKey(key)).toBe(false);
    });
  });

  it.each([
    ['__expo_config_mode', '__expo_config_mode'],
    ['__expo_config_mode', '__EXPO_CONFIG_MODE'],
  ])('never allows config mode %s through unsafe opt-in %s', (key, allowed) => {
    process.env.EXPO_UNSAFE_DOTENV_KEYS = allowed;
    jest.isolateModules(() => {
      const constants = require('../constants');
      expect(constants.isUnsafeAllowedEnvKey(key)).toBe(false);
      expect(constants.isIgnoredEnvKey(key)).toBe(true);
    });
  });
});
