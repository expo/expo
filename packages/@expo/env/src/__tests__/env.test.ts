import { vol, fs } from 'memfs';

import { createControlledEnvironment, getFiles } from '../env';

beforeEach(() => {
  vol.reset();
});

const originalEnv = process.env;

function resetEnv() {
  process.env = originalEnv;
  delete process.env.EXPO_NO_DOTENV;
}

beforeEach(() => {
  resetEnv();
});
afterAll(() => {
  resetEnv();
});

describe(getFiles, () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
    resetEnv();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it(`gets development files`, () => {
    expect(getFiles('development')).toEqual([
      '.env.development.local',
      '.env.local',
      '.env.development',
      '.env',
    ]);
  });
  it(`gets production files`, () => {
    expect(getFiles('production')).toEqual([
      '.env.production.local',
      '.env.local',
      '.env.production',
      '.env',
    ]);
  });
  it(`gets test files`, () => {
    // important
    expect(getFiles('test')).toEqual(['.env.test.local', '.env.test', '.env']);
  });
  it(`gets no files when dotenv is disabled`, () => {
    process.env.EXPO_NO_DOTENV = '1';
    ['development', 'production', 'test'].forEach((mode) => {
      expect(getFiles(mode)).toEqual([]);
    });
  });

  it(`throws if NODE_ENV is not set`, () => {
    getFiles(undefined);

    expect(console.error).toBeCalledTimes(2);
    expect(console.error).toBeCalledWith(
      expect.stringContaining('The NODE_ENV environment variable is required but was not specified')
    );
  });
  it(`throws if NODE_ENV is not valid`, () => {
    expect(() => getFiles('invalid')).toThrowErrorMatchingInlineSnapshot(
      `"Environment variable "NODE_ENV=invalid" is invalid. Valid values are "development", "test", and "production"`
    );
  });
});

describe('get', () => {
  beforeEach(() => {
    resetEnv();
  });

  it(`memoizes`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
      },
      '/'
    );

    expect(envRuntime.get('/')).toEqual({
      env: {
        FOO: 'default',
      },
      files: ['/.env'],
    });

    fs.writeFileSync('/.env', 'FOO=changed');

    expect(envRuntime.get('/')).toEqual({
      env: {
        FOO: 'default',
      },
      files: ['/.env'],
    });
    expect(envRuntime.get('/', { force: true })).toEqual({
      env: {
        FOO: 'changed',
      },
      files: ['/.env'],
    });
  });
});

describe('load', () => {
  const originalLog = console.log;
  beforeEach(() => {
    console.log = jest.fn();
    resetEnv();
  });
  afterEach(() => {
    console.log = originalLog;
  });

  it(`logs the loaded variables and files`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
      },
      '/'
    );

    envRuntime.load('/');

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('.env'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('FOO'));
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  it(`logs the loaded variables and files`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
      },
      '/'
    );

    envRuntime.load('/');

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('.env'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('FOO'));
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  it(`does not log on initial load if no env vars`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': '',
      },
      '/'
    );

    envRuntime.load('/');
    expect(console.log).not.toHaveBeenCalled();
  });

  it(`does not log after initial load if nothing changes`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
      },
      '/'
    );

    envRuntime.load('/');
    envRuntime.load('/');
  });

  it(`logs after initial load if something changes`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
      },
      '/'
    );

    envRuntime.load('/');
    expect(console.log).toHaveBeenCalledTimes(2);

    fs.writeFileSync('/.env', 'FOO=changed');
    expect(console.log).toHaveBeenCalledTimes(4);
  });
});

describe('_getForce', () => {
  beforeEach(() => {
    resetEnv();
  });

  it(`returns the value of the environment variable`, () => {
    delete process.env.FOO;

    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=bar',
      },
      '/'
    );

    expect(envRuntime._getForce('/')).toEqual({
      env: {
        FOO: 'bar',
      },
      files: ['/.env'],
    });
  });

  it(`cascades env files (development)`, () => {
    delete process.env.FOO;
    process.env.NODE_ENV = 'development';
    const envRuntime = createControlledEnvironment();
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

    expect(envRuntime._getForce('/')).toEqual({
      env: {
        FOO: 'dev-local',
      },
      files: ['/.env.development.local', '/.env.local', '/.env.development', '/.env'],
    });
  });

  it(`cascades env files (production)`, () => {
    delete process.env.FOO;
    process.env.NODE_ENV = 'production';
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
        '.env.production': 'FOO=prod',
        '.env.production.local': 'FOO=prod-local',
      },
      '/'
    );

    expect(envRuntime._getForce('/')).toEqual({
      files: ['/.env.production.local', '/.env.local', '/.env.production', '/.env'],
      env: {
        FOO: 'prod-local',
      },
    });
  });

  it(`cascades env files (default)`, () => {
    delete process.env.FOO;
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
      },
      '/'
    );

    expect(envRuntime._getForce('/')).toEqual({
      files: ['/.env.local', '/.env'],
      env: {
        FOO: 'default-local',
      },
    });
  });

  it(`skips modifying the environment with dotenv if disabled with EXPO_NO_DOTENV`, () => {
    delete process.env.FOO;
    process.env.EXPO_NO_DOTENV = '1';
    const envRuntime = createControlledEnvironment();
    vol.fromJSON(
      {
        '.env': 'FOO=default',
        '.env.local': 'FOO=default-local',
      },
      '/'
    );

    expect(envRuntime._getForce('/')).toEqual({ env: {}, files: [] });
  });

  it(`does not return the env var if process.env contained variable of the same name before loading`, () => {
    const envRuntime = createControlledEnvironment();
    process.env.FOO = 'not-bar';

    vol.fromJSON(
      {
        '.env': 'FOO=bar',
      },
      '/'
    );

    expect(envRuntime._getForce('/')).toEqual({ env: {}, files: ['/.env'] });
  });

  it(`Does not fail when no files are available`, () => {
    vol.fromJSON({}, '/');
    expect(createControlledEnvironment()._getForce('/')).toEqual({
      env: {},
      files: [],
    });
  });

  it(`Does not assert on invalid env files`, () => {
    vol.fromJSON(
      {
        '.env': 'ˆ˙•ª∆ø…ˆ',
      },
      '/'
    );

    expect(createControlledEnvironment()._getForce('/')).toEqual({ env: {}, files: ['/.env'] });
  });
});
