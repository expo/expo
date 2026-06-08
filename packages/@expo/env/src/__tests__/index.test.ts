import { vol } from 'memfs';
import console from 'node:console';
import process from 'node:process';
import { stripVTControlCharacters } from 'node:util';

import type { loadEnvFiles } from '../';
import {
  getEnvFiles,
  getOriginalEnv,
  getOriginalEnvValue,
  LOADED_ENV_NAME,
  loadProjectEnv,
  logLoadedEnv,
  parseEnvFiles,
  parseProjectEnv,
} from '../';

jest.mock('node:console', () => {
  const console = jest.requireActual('node:console');
  return {
    ...console,
    error: jest.fn(console.error),
    warn: jest.fn(console.warn),
    log: jest.fn(console.log),
  };
});

/** The original reference to `process.env`, containing the actual environment variables. */
const originalEnv = { ...process.env } as Readonly<NodeJS.ProcessEnv>;

beforeEach(() => {
  vol.reset();
  // Mock the environment variables, to be edited within tests
  process.env = { ...originalEnv } as NodeJS.ProcessEnv;
});
afterAll(() => {
  // Clear the mocked environment, reusing the original object instance
  process.env = originalEnv;
});

describe(getEnvFiles, () => {
  it(`gets development files`, () => {
    expect(getEnvFiles({ mode: 'development' })).toEqual([
      '.env.development.local',
      '.env.local',
      '.env.development',
      '.env',
    ]);
  });

  it(`gets production files`, () => {
    expect(getEnvFiles({ mode: 'production' })).toEqual([
      '.env.production.local',
      '.env.local',
      '.env.production',
      '.env',
    ]);
  });

  it(`gets test files`, () => {
    // important
    expect(getEnvFiles({ mode: 'test' })).toEqual(['.env.test.local', '.env.test', '.env']);
  });

  it(`gets no files when dotenv is disabled`, () => {
    process.env.EXPO_NO_DOTENV = '1';

    expect(getEnvFiles({ mode: 'test' })).toEqual([]);
    expect(getEnvFiles({ mode: 'development' })).toEqual([]);
    expect(getEnvFiles({ mode: 'production' })).toEqual([]);
  });

  it(`uses NODE_ENV as mode by default`, () => {
    process.env.NODE_ENV = 'development';

    expect(getEnvFiles()).toEqual([
      '.env.development.local',
      '.env.local',
      '.env.development',
      '.env',
    ]);
  });

  it(`errors if NODE_ENV is not set`, () => {
    delete process.env.NODE_ENV;
    jest.mocked(console.error).mockImplementation();

    getEnvFiles();

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('The NODE_ENV environment variable is required but was not specified')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Using only .env.local and .env')
    );
  });
  it(`warns if NODE_ENV is not valid`, () => {
    process.env.NODE_ENV = 'invalid';
    jest.mocked(console.warn).mockImplementation();

    expect(() => getEnvFiles()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('NODE_ENV="invalid" is non-conventional')
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Use "development", "test", or "production"')
    );
  });
  it(`does not warn if NODE_ENV is not valid when in silent mode`, () => {
    process.env.NODE_ENV = 'invalid';
    jest.mocked(console.warn).mockImplementation();

    expect(() => getEnvFiles({ silent: true })).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe(parseProjectEnv, () => {
  it('parses .env file without mutating system environment variables', () => {
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');
    expect(parseProjectEnv('/')).toMatchObject({
      env: { FOO: 'bar' },
      files: ['/.env'],
    });
    expect(process.env['FOO']).toBeUndefined();
  });

  it(`cascades env files (development)`, () => {
    process.env.NODE_ENV = 'development';
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
        '.env.development': 'FOO=dev',
        '.env.production': 'FOO=prod',
        '.env.production.local': 'FOO=prod-local',
        '.env.development.local': 'FOO=dev-local',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env.development.local', '/.env.local', '/.env.development', '/.env'],
      env: {
        FOO: 'dev-local',
      },
    });
  });

  it(`cascades env files (production)`, () => {
    process.env.NODE_ENV = 'production';
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
        '.env.production': 'FOO=prod',
        '.env.production.local': 'FOO=prod-local',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env.production.local', '/.env.local', '/.env.production', '/.env'],
      env: {
        FOO: 'prod-local',
      },
    });
  });

  it(`cascades env files (test)`, () => {
    process.env.NODE_ENV = 'test'; // Jest is setting `NODE_ENV=test`, just for clarity
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env'],
      env: {
        FOO: 'default',
      },
    });
  });

  it(`cascades env files (default)`, () => {
    delete process.env.NODE_ENV; // Jest is setting `NODE_ENV=test`, make sure to unset it
    jest.mocked(console.error).mockImplementation();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env.local', '/.env'],
      env: {
        FOO: 'default-local',
      },
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Using only .env.local and .env')
    );
  });

  it('expands variables', () => {
    process.env.USER_DEFINED = 'user-defined';
    vol.fromJSON(
      {
        '.env': 'TEST_EXPAND=${USER_DEFINED}',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env'],
      env: {
        TEST_EXPAND: 'user-defined',
      },
    });
  });

  it('expands variables from cascading env files (development)', () => {
    process.env.USER_DEFINED = 'user-defined';
    process.env.NODE_ENV = 'development';
    vol.fromJSON(
      {
        '.env': ['TEST_EXPAND=.env', 'TEST_VALUE_ENV=test'].join('\n'),
        '.env.development': [
          'TEST_EXPAND=.env.development',
          'TEST_INTERMEDIATE=${TEST_VALUE_ENV}',
        ].join('\n'),
        '.env.local': ['TEST_EXPAND=${USER_DEFINED}'].join('\n'),
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env.local', '/.env.development', '/.env'],
      env: {
        TEST_EXPAND: 'user-defined',
        TEST_VALUE_ENV: 'test',
        TEST_INTERMEDIATE: 'test',
      },
    });
  });

  it('expands variables safely without recursive loop', () => {
    process.env.USER_DEFINED = 'user-defined';
    vol.fromJSON(
      {
        // This should not expand to itself, causing a recursive loop
        '.env': 'TEST_EXPAND=${TEST_EXPAND}',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({
      files: ['/.env'],
      env: {
        // NOTE: This value is untouched before dotenv-expand@11.0.7 but fixed to be empty after
        TEST_EXPAND: '',
      },
    });
  });

  it(`skips parsing the environment with dotenv if disabled with EXPO_NO_DOTENV`, () => {
    process.env.EXPO_NO_DOTENV = '1';
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({ env: {}, files: [] });
  });

  it(`does not fail when no files are available`, () => {
    vol.fromJSON({}, '/');
    expect(parseProjectEnv('/')).toMatchObject({
      env: {},
      files: [],
    });
  });

  it(`does not assert on invalid env files`, () => {
    vol.fromJSON(
      {
        '.env': 'ˆ˙•ª∆ø…ˆ',
      },
      '/'
    );

    expect(parseProjectEnv('/')).toMatchObject({ env: {}, files: ['/.env'] });
  });
});

describe(loadProjectEnv, () => {
  it('parses .env file with mutating system environment variables', () => {
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    expect(loadProjectEnv('/')).toMatchObject({
      result: 'loaded',
      env: { FOO: 'bar' },
      files: ['/.env'],
      loaded: ['FOO'],
    });

    expect(process.env['FOO']).toBe('bar');
  });

  it('does not mutate when the system environment is marked as loaded', () => {
    process.env[LOADED_ENV_NAME] = JSON.stringify(['FOO']);
    process.env.FOO = 'previous';
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    expect(loadProjectEnv('/')).toEqual({
      result: 'skipped',
      loaded: ['FOO'],
    });
    expect(process.env['FOO']).toBe('previous');
  });

  it('mutates without overwriting after previous mutation when using force', () => {
    process.env[LOADED_ENV_NAME] = JSON.stringify(['FOO']);
    process.env.FOO = 'previous';
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    expect(loadProjectEnv('/', { force: true })).toMatchObject({
      result: 'loaded',
      env: { FOO: 'bar' },
      files: ['/.env'],
      loaded: [],
    });
    expect(process.env['FOO']).toBe('previous');
  });

  it('does not mutate `envFiles` list when parsing', () => {
    const envFiles = ['/.env.local', '/.env'];

    vol.fromJSON(
      {
        '.env': 'FOO=hello\nHELLO=old', // lower priority, will be parsed first
        '.env.local': 'BAR=$FOO\nHELLO=new', // higher priority, will be parsed last (and override .env)
      },
      '/'
    );

    // Run both the parsing and assertions twice
    for (let i = 0; i < 2; i++) {
      // Ensure the environment variables are parsed into an empty system environment
      expect(parseEnvFiles(envFiles, { systemEnv: {} })).toMatchObject({
        files: ['/.env.local', '/.env'],
        env: {
          FOO: 'hello',
          BAR: 'hello', // If `.env.local` is loaded before `.env`, this can't be resolved
          HELLO: 'new',
        },
      });
    }

    // Ensure the envFiles are not mutated
    expect(envFiles).toEqual(['/.env.local', '/.env']);
  });

  it('handles ENOENT errors when reading env file', () => {
    vol.fromJSON({}, '/');

    // Ensure no error is thrown, and nothing was parsed
    expect(parseEnvFiles(['/.env.local', '/.env'])).toMatchObject({
      files: [],
      env: {},
    });
  });

  it('handles EISDIR errors when reading env file', () => {
    vol.fromJSON(
      {
        '.env.local': 'FOO=bar',
        '.env/test.txt': 'mocking `.env` as folder',
      },
      '/'
    );

    // Ensure no error is thrown, and nothing was parsed
    expect(parseEnvFiles(['/.env.local', '/.env'])).toMatchObject({
      files: ['/.env.local'],
      env: { FOO: 'bar' },
    });
  });

  it('handles EACCES errors when reading env file', () => {
    vol.fromJSON({ '.env.local': 'FOO=bar' }, '/');

    // Write the `.env` without any read permissions
    vol.writeFileSync('/.env', 'TEST=no-access', { mode: 0 });

    expect(parseEnvFiles(['/.env.local', '/.env'])).toMatchObject({
      files: ['/.env.local'],
      env: { FOO: 'bar' },
    });
  });
});

describe(getOriginalEnv, () => {
  it('returns a clone of process.env when nothing has been loaded', () => {
    delete process.env.FOO;
    process.env.PRE_EXISTING = 'original';

    const original = getOriginalEnv();

    expect(original).toEqual(process.env);
    expect(original).not.toBe(process.env);
  });

  it('mutating the result does not affect process.env', () => {
    process.env.PRE_EXISTING = 'original';

    const original = getOriginalEnv();
    original.PRE_EXISTING = 'mutated';
    original.NEW_KEY = 'added';

    expect(process.env.PRE_EXISTING).toBe('original');
    expect(process.env.NEW_KEY).toBeUndefined();
  });

  it('strips keys added by loadProjectEnv', () => {
    delete process.env.FOO;
    delete process.env.BAR;
    process.env.PRE_EXISTING = 'original';
    vol.fromJSON({ '.env': 'FOO=from-env\nBAR=also-from-env' }, '/');

    loadProjectEnv('/');
    expect(process.env.FOO).toBe('from-env');
    expect(process.env.BAR).toBe('also-from-env');

    const original = getOriginalEnv();
    expect(original.FOO).toBeUndefined();
    expect(original.BAR).toBeUndefined();
    expect(original.PRE_EXISTING).toBe('original');
  });

  it('strips the LOADED_ENV_NAME marker', () => {
    delete process.env[LOADED_ENV_NAME];
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    loadProjectEnv('/');
    expect(process.env[LOADED_ENV_NAME]).toBeDefined();

    expect(getOriginalEnv()[LOADED_ENV_NAME]).toBeUndefined();
  });

  it('preserves the pre-load value when loadProjectEnv skipped the assignment', () => {
    process.env.FOO = 'shell-provided';
    vol.fromJSON({ '.env': 'FOO=from-env' }, '/');

    loadProjectEnv('/');
    // `loadProjectEnv` does not overwrite a key already defined in the system env
    expect(process.env.FOO).toBe('shell-provided');

    expect(getOriginalEnv().FOO).toBe('shell-provided');
  });

  it('reverts mutations made after parseProjectEnv (the reloadEnvFiles pattern)', () => {
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=from-env' }, '/');

    // parseProjectEnv does not mutate, but it does record originals so that
    // an external mutator (e.g. @expo/cli's reloadEnvFiles) is covered.
    parseProjectEnv('/');
    expect(process.env.FOO).toBeUndefined();

    process.env.FOO = 'manually-set';
    expect(getOriginalEnv().FOO).toBeUndefined();
  });

  it('keeps the first-observed original across reloads', () => {
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=first' }, '/');

    loadProjectEnv('/');
    expect(process.env.FOO).toBe('first');

    vol.fromJSON({ '.env': 'FOO=second' }, '/');
    loadProjectEnv('/', { force: true });

    expect(getOriginalEnv().FOO).toBeUndefined();
  });

  it('keeps the backup per target env object', () => {
    const customEnv: NodeJS.ProcessEnv = {};
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    parseProjectEnv('/', { systemEnv: customEnv });
    customEnv.FOO = 'bar';

    // Reverting against the custom env strips FOO
    expect(getOriginalEnv(customEnv).FOO).toBeUndefined();
    // The default (process.env) backup is untouched
    expect(getOriginalEnv()).not.toHaveProperty('FOO');
  });

  it('passes through keys never touched by .env files', () => {
    process.env.UNRELATED = 'unrelated-value';
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    loadProjectEnv('/');

    expect(getOriginalEnv().UNRELATED).toBe('unrelated-value');
  });

  it('honors EXPO_UNSAFE_DOTENV_KEYS by not reverting opted-in keys', () => {
    const prev = process.env.EXPO_UNSAFE_DOTENV_KEYS;
    process.env.EXPO_UNSAFE_DOTENV_KEYS = 'JAVA_HOME';
    try {
      jest.isolateModules(() => {
        const mod = require('../');
        delete process.env.JAVA_HOME;
        vol.fromJSON({ '.env': 'JAVA_HOME=/opt/jdk-17' }, '/');

        mod.loadProjectEnv('/');
        expect(process.env.JAVA_HOME).toBe('/opt/jdk-17');

        expect(mod.getOriginalEnv().JAVA_HOME).toBe('/opt/jdk-17');
      });
    } finally {
      if (prev === undefined) delete process.env.EXPO_UNSAFE_DOTENV_KEYS;
      else process.env.EXPO_UNSAFE_DOTENV_KEYS = prev;
    }
  });
});

describe(getOriginalEnvValue, () => {
  it('returns the systemEnv value when no load has happened', () => {
    process.env.UNTOUCHED = 'value';
    expect(getOriginalEnvValue('UNTOUCHED')).toBe('value');
  });

  it('returns undefined for a key added by loadProjectEnv', () => {
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    loadProjectEnv('/');
    expect(process.env.FOO).toBe('bar');

    expect(getOriginalEnvValue('FOO')).toBeUndefined();
  });

  it('falls through to systemEnv for keys @expo/env never touched', () => {
    process.env.UNRELATED = 'unrelated-value';
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    loadProjectEnv('/');

    expect(getOriginalEnvValue('UNRELATED')).toBe('unrelated-value');
  });

  it('returns the first-observed original across reloads', () => {
    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=first' }, '/');

    loadProjectEnv('/');
    vol.fromJSON({ '.env': 'FOO=second' }, '/');
    loadProjectEnv('/', { force: true });

    expect(getOriginalEnvValue('FOO')).toBeUndefined();
  });

  it('returns the pre-load value when loadProjectEnv skipped the assignment', () => {
    process.env.FOO = 'shell-provided';
    vol.fromJSON({ '.env': 'FOO=from-env' }, '/');

    loadProjectEnv('/');
    expect(getOriginalEnvValue('FOO')).toBe('shell-provided');
  });

  it('reads against a custom systemEnv', () => {
    const customEnv: NodeJS.ProcessEnv = {};
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    parseProjectEnv('/', { systemEnv: customEnv });
    customEnv.FOO = 'manually-set';

    expect(getOriginalEnvValue('FOO', customEnv)).toBeUndefined();
    expect(getOriginalEnvValue('FOO')).toBeUndefined();
  });

  it('honors EXPO_UNSAFE_DOTENV_KEYS by returning the loaded value', () => {
    const prev = process.env.EXPO_UNSAFE_DOTENV_KEYS;
    process.env.EXPO_UNSAFE_DOTENV_KEYS = 'JAVA_HOME';
    try {
      jest.isolateModules(() => {
        const mod = require('../');
        delete process.env.JAVA_HOME;
        vol.fromJSON({ '.env': 'JAVA_HOME=/opt/jdk-17' }, '/');

        mod.loadProjectEnv('/');
        expect(mod.getOriginalEnvValue('JAVA_HOME')).toBe('/opt/jdk-17');
      });
    } finally {
      if (prev === undefined) delete process.env.EXPO_UNSAFE_DOTENV_KEYS;
      else process.env.EXPO_UNSAFE_DOTENV_KEYS = prev;
    }
  });

  it('shares backup state across multiple installations via globalThis', () => {
    // Simulate two copies of @expo/env (e.g. hoisted + nested) by importing
    // the module twice in isolated caches. Each gets its own module-level
    // bindings; only the global backup store should be shared.
    let modA: typeof import('../') | undefined;
    let modB: typeof import('../') | undefined;
    jest.isolateModules(() => {
      modA = require('../');
    });
    jest.isolateModules(() => {
      modB = require('../');
    });

    delete process.env.FOO;
    vol.fromJSON({ '.env': 'FOO=bar' }, '/');

    // Recorded by copy A's mutation path…
    modA!.loadProjectEnv('/');
    // …and observable through copy B's read path.
    expect(modB!.getOriginalEnvValue('FOO')).toBeUndefined();
    expect(modB!.getOriginalEnv().FOO).toBeUndefined();
  });
});

describe('isLocalEnvKey policy', () => {
  it('throws when a local-only key is set in a non-.local file', () => {
    delete process.env.ANDROID_HOME;
    vol.fromJSON({ '.env': 'ANDROID_HOME=/evil/sdk\nUNRELATED=ok' }, '/');

    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(/ANDROID_HOME/);
    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(/\.local/);
  });

  it('allows local-only keys when loaded from .env.local', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ANDROID_HOME;
    vol.fromJSON({ '.env.local': 'ANDROID_HOME=/dev/sdk' }, '/');

    const result = parseProjectEnv('/', { systemEnv: {} });
    expect(result.env.ANDROID_HOME).toBe('/dev/sdk');
  });

  it('allows local-only keys when loaded from .env.<mode>.local', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JAVA_HOME;
    vol.fromJSON({ '.env.development.local': 'JAVA_HOME=/opt/jdk-17' }, '/');

    const result = parseProjectEnv('/', { systemEnv: {} });
    expect(result.env.JAVA_HOME).toBe('/opt/jdk-17');
  });

  it('throws when a local-only key is set in .env.<mode> (committed mode file)', () => {
    process.env.NODE_ENV = 'production';
    vol.fromJSON({ '.env.production': 'ANDROID_HOME=/evil/sdk' }, '/');

    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(/ANDROID_HOME/);
  });

  it('throws if a committed file sets a local-only key even when .local also sets it', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ANDROID_HOME;
    vol.fromJSON(
      {
        '.env': 'ANDROID_HOME=/committed-attacker',
        '.env.local': 'ANDROID_HOME=/developer-override',
      },
      '/'
    );

    // The .local override is irrelevant — the committed `.env` is still a misconfiguration
    // that the developer should fix, so parseProjectEnv refuses to load anything.
    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(/ANDROID_HOME/);
  });

  it('honors EXPO_UNSAFE_DOTENV_KEYS to allow a local-only key in any file', () => {
    const prev = process.env.EXPO_UNSAFE_DOTENV_KEYS;
    process.env.EXPO_UNSAFE_DOTENV_KEYS = 'ANDROID_HOME';
    try {
      jest.isolateModules(() => {
        const mod = require('../');
        vol.fromJSON({ '.env': 'ANDROID_HOME=/explicit-opt-in' }, '/');

        const result = mod.parseProjectEnv('/', { systemEnv: {} });
        expect(result.env.ANDROID_HOME).toBe('/explicit-opt-in');
      });
    } finally {
      if (prev === undefined) delete process.env.EXPO_UNSAFE_DOTENV_KEYS;
      else process.env.EXPO_UNSAFE_DOTENV_KEYS = prev;
    }
  });

  it('throws on the committed-attacker scenario end-to-end via loadProjectEnv', () => {
    delete process.env.ANDROID_HOME;
    vol.fromJSON({ '.env': 'ANDROID_HOME=/attacker/sdk' }, '/');

    expect(() => loadProjectEnv('/')).toThrow(/ANDROID_HOME/);
    // loadProjectEnv aborts before mutating process.env
    expect(process.env.ANDROID_HOME).toBeUndefined();
  });

  it('throws on hard-blocked keys with a message pointing to EXPO_UNSAFE_DOTENV_KEYS', () => {
    vol.fromJSON({ '.env': 'NODE_OPTIONS=--require=./payload.js' }, '/');

    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(/NODE_OPTIONS/);
    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(/EXPO_UNSAFE_DOTENV_KEYS/);
  });

  it('combines both violation classes into a single thrown error', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ANDROID_HOME;
    vol.fromJSON(
      {
        '.env': 'NODE_OPTIONS=--require=./payload.js\nANDROID_HOME=/evil/sdk',
      },
      '/'
    );

    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(
      /NODE_OPTIONS[\s\S]*ANDROID_HOME/
    );
  });

  it('throws on package-manager registry/install vars even in .local files', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NPM_CONFIG_REGISTRY;
    delete process.env.YARN_REGISTRY;
    delete process.env.PNPM_HOME;
    delete process.env.BUN_INSTALL;
    vol.fromJSON(
      {
        '.env.local': [
          'NPM_CONFIG_REGISTRY=https://attacker.example/npm',
          'YARN_REGISTRY=https://attacker.example/yarn',
          'PNPM_HOME=/attacker/pnpm',
          'BUN_INSTALL=/attacker/bun',
        ].join('\n'),
      },
      '/'
    );

    expect(() => parseProjectEnv('/', { systemEnv: {} })).toThrow(
      /NPM_CONFIG_REGISTRY.*YARN_REGISTRY|YARN_REGISTRY.*NPM_CONFIG_REGISTRY/s
    );
  });
});

describe(logLoadedEnv, () => {
  const envInfo: ReturnType<typeof loadEnvFiles> = {
    result: 'loaded',
    files: ['/.env.production.local', '/.env.production', '.env.local'],
    env: { FOO: 'test1', BAR: 'test2' },
    loaded: ['FOO', 'BAR'],
  };

  it('logs environment vaiables and files', () => {
    // Hide the logs from the Jest output
    jest.mocked(console.log).mockImplementation();

    // Ensure `logLoadedEnv` returns the env info as-is
    expect(logLoadedEnv(envInfo)).toBe(envInfo);
    // Ensure `console.log` with environment files was called first
    expect(stripVTControlCharacters(jest.mocked(console.log).mock.calls[0][0])).toBe(
      'env: load .env.production.local .env.production .env.local'
    );
    // Ensure `console.log` with environment variables was called second
    expect(stripVTControlCharacters(jest.mocked(console.log).mock.calls[1][0])).toBe(
      'env: export FOO BAR'
    );
  });

  it('only logs the environment variables when skipping the load process', () => {
    const skippedEnvInfo: ReturnType<typeof loadEnvFiles> = {
      result: 'skipped',
      loaded: ['FOO', 'BAR'],
    };

    // Ensure `logLoadedEnv` returns the env info as-is
    expect(logLoadedEnv(skippedEnvInfo)).toBe(skippedEnvInfo);
    // Ensure no `console.log` was called
    expect(stripVTControlCharacters(jest.mocked(console.log).mock.calls[0][0])).toBe(
      'env: export FOO BAR'
    );
  });

  it('skips logging when running with `force: true`', () => {
    // Ensure `logLoadedEnv` returns the env info as-is
    expect(logLoadedEnv(envInfo, { force: true })).toBe(envInfo);
    // Ensure no `console.log` was called
    expect(console.log).not.toHaveBeenCalled();
  });

  it('skips logging when running with `silent: true`', () => {
    // Ensure `logLoadedEnv` returns the env info as-is
    expect(logLoadedEnv(envInfo, { silent: true })).toBe(envInfo);
    // Ensure no `console.log` was called
    expect(console.log).not.toHaveBeenCalled();
  });

  it('skips logging when no environment variables are loaded', () => {
    const envInfoWithoutVars = { ...envInfo, env: {}, loaded: [] };
    // Ensure `logLoadedEnv` returns the env info as-is
    expect(logLoadedEnv(envInfoWithoutVars)).toBe(envInfoWithoutVars);
    // Ensure no `console.log` was called
    expect(console.log).not.toHaveBeenCalled();
  });

  it('logs a yellow (sensitive) line when local-only keys were loaded from .local', () => {
    jest.mocked(console.log).mockImplementation();

    const sensitiveEnvInfo: ReturnType<typeof loadEnvFiles> = {
      ...envInfo,
      sensitiveLoadedKeys: ['ANDROID_HOME', 'JAVA_HOME'],
    };

    logLoadedEnv(sensitiveEnvInfo);
    const calls = jest.mocked(console.log).mock.calls.map((c) => stripVTControlCharacters(c[0]));
    expect(calls).toEqual([
      'env: load .env.production.local .env.production .env.local',
      'env: export FOO BAR',
      'env: export (sensitive) ANDROID_HOME JAVA_HOME',
    ]);
  });

  it('does not emit the (sensitive) line when sensitiveLoadedKeys is empty', () => {
    jest.mocked(console.log).mockImplementation();

    logLoadedEnv({ ...envInfo, sensitiveLoadedKeys: [] });
    const calls = jest.mocked(console.log).mock.calls.map((c) => stripVTControlCharacters(c[0]));
    expect(calls).toEqual([
      'env: load .env.production.local .env.production .env.local',
      'env: export FOO BAR',
    ]);
  });
});

it('does not leak environment variables between tests', () => {
  // If this test fails, it means that the test environment is not set-up properly.
  // Environment variables are leaking between "originalEnv" and "process.env", causing unexpected test failures/passes.
  expect(originalEnv.INTERNAL_LEAK_TEST).toBeUndefined();

  process.env.INTERNAL_LEAK_TEST = 'changed';

  expect(process.env.INTERNAL_LEAK_TEST).toBe('changed');
  expect(originalEnv.INTERNAL_LEAK_TEST).toBeUndefined();
});
