import { Log } from '../../log';
import { envIsWebcontainer } from '../../utils/env';
import { choosePortAsync, resolveMetroPortAsync } from '../../utils/port';
import { getOptionalDevClientSchemeAsync } from '../../utils/scheme';
import { canResolveDevClient, hasDirectDevClientDependency } from '../detectDevClient';
import {
  resolveSchemeAsync,
  resolveHostType,
  resolveOptionsAsync,
  resolvePortsAsync,
} from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../utils/env', () => ({
  ...jest.requireActual('../../utils/env'),
  envIsWebcontainer: jest.fn(() => false),
}));
jest.mock('../../utils/port', () => {
  return {
    resolveMetroPortAsync: jest.fn(),
    choosePortAsync: jest.fn(),
  };
});
jest.mock('../../utils/scheme', () => {
  return {
    getOptionalDevClientSchemeAsync: jest.fn(async () => ({
      scheme: 'myapp',
      resolution: 'config',
    })),
  };
});
jest.mock('../detectDevClient', () => {
  return {
    canResolveDevClient: jest.fn(async () => false),
    hasDirectDevClientDependency: jest.fn(() => false),
  };
});

describe(resolveSchemeAsync, () => {
  it(`returns null with no options and no dev client installed`, async () => {
    jest.mocked(canResolveDevClient).mockReturnValueOnce(false);

    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: false,
      })
    ).toBe(null);
    expect(getOptionalDevClientSchemeAsync).not.toHaveBeenCalled();
  });

  it(`always gives scheme option the highest priority`, async () => {
    expect(
      await resolveSchemeAsync('/', {
        scheme: 'myapp',
        devClient: true,
      })
    ).toBe('myapp');
    expect(canResolveDevClient).not.toHaveBeenCalled();
    expect(getOptionalDevClientSchemeAsync).not.toHaveBeenCalled();
  });

  it(`does not check if dev client can be resolved when dev client flag is passed`, async () => {
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: true,
      })
    ).toBe('myapp');
    expect(canResolveDevClient).not.toHaveBeenCalled();
    expect(getOptionalDevClientSchemeAsync).toHaveBeenCalled();
  });

  it(`checks for schemes if dev client is installed in the project and scheme isn't passed`, async () => {
    jest.mocked(canResolveDevClient).mockReturnValueOnce(true);
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: false,
      })
    ).toBe('myapp');
    expect(canResolveDevClient).toHaveBeenCalled();
  });

  it(`warns when a native directory doesn't define schemes and dev client is installed`, async () => {
    jest.mocked(getOptionalDevClientSchemeAsync).mockResolvedValueOnce({
      scheme: null,
      resolution: 'android',
    });
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: true,
      })
    ).toBe(null);
    expect(getOptionalDevClientSchemeAsync).toHaveBeenCalled();
    expect(Log.warn).toHaveBeenCalled();
  });
  it(`warns when both native directories are defined and neither define a shared scheme`, async () => {
    jest.mocked(getOptionalDevClientSchemeAsync).mockResolvedValueOnce({
      scheme: null,
      resolution: 'shared',
    });
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: true,
      })
    ).toBe(null);
    expect(getOptionalDevClientSchemeAsync).toHaveBeenCalled();
    expect(Log.warn).toHaveBeenCalled();
  });
  it(`does not warn when the config resolution of a scheme returns null`, async () => {
    jest.mocked(getOptionalDevClientSchemeAsync).mockResolvedValueOnce({
      scheme: null,
      resolution: 'config',
    });
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: true,
      })
    ).toBe(null);
    expect(getOptionalDevClientSchemeAsync).toHaveBeenCalled();
    expect(Log.warn).not.toHaveBeenCalled();
  });
  it(`does not warn when a scheme can be resolved from the project`, async () => {
    jest.mocked(getOptionalDevClientSchemeAsync).mockResolvedValueOnce({
      scheme: 'a',
      resolution: 'ios',
    });
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: true,
      })
    ).toBe('a');
    expect(getOptionalDevClientSchemeAsync).toHaveBeenCalled();
    expect(Log.warn).not.toHaveBeenCalled();
  });
  it(`does not warn when a scheme can be resolved from both projects`, async () => {
    jest.mocked(getOptionalDevClientSchemeAsync).mockResolvedValueOnce({
      scheme: 'a',
      resolution: 'shared',
    });
    expect(
      await resolveSchemeAsync('/', {
        scheme: undefined,
        devClient: true,
      })
    ).toBe('a');
    expect(getOptionalDevClientSchemeAsync).toHaveBeenCalled();
    expect(Log.warn).not.toHaveBeenCalled();
  });
});

describe(resolveOptionsAsync, () => {
  it(`prevents using --dev-client and --go together`, async () => {
    await expect(
      resolveOptionsAsync('/noop', {
        '--dev-client': true,
        '--go': true,
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot use both --dev-client and --go together."`
    );
  });
  it(`--go sets devClient to false`, async () => {
    expect(
      (
        await resolveOptionsAsync('/noop', {
          '--go': true,
        })
      ).devClient
    ).toBe(false);
  });
  it(`defaults to devClient being false`, async () => {
    expect((await resolveOptionsAsync('/noop', {})).devClient).toBe(false);
  });
  it(`sets devClient to true`, async () => {
    expect((await resolveOptionsAsync('/noop', { '--dev-client': true })).devClient).toBe(true);
  });
  it(`infers that devClient should be true`, async () => {
    jest.mocked(hasDirectDevClientDependency).mockReturnValueOnce(true);
    expect((await resolveOptionsAsync('/noop', {})).devClient).toBe(true);
  });
  it(`--go forces devClient to false`, async () => {
    jest.mocked(hasDirectDevClientDependency).mockReturnValueOnce(true);
    expect((await resolveOptionsAsync('/noop', { '--go': true })).devClient).toBe(false);
  });
});

describe(resolveHostType, () => {
  it(`resolves no options`, () => {
    expect(resolveHostType({})).toBe('lan');
  });
  it(`resolves host type`, () => {
    expect(resolveHostType({ lan: true })).toBe('lan');
    expect(resolveHostType({ localhost: true })).toBe('localhost');
    expect(resolveHostType({ tunnel: true })).toBe('tunnel');
    expect(resolveHostType({ offline: true })).toBe('lan');
    expect(resolveHostType({ host: 'tunnel' })).toBe('tunnel');
    // Default
    expect(resolveHostType({})).toBe('lan');
  });
  it(`asserts invalid host type`, () => {
    expect(() => resolveHostType({ host: 'bacon' })).toThrow();
  });
  it(`asserts conflicting options`, () => {
    expect(() => resolveHostType({ localhost: true, offline: true })).toThrow(/Specify at most/);
    expect(() => resolveHostType({ localhost: true, host: 'lan' })).toThrow(/Specify at most/);
    expect(() => resolveHostType({ localhost: true, lan: true })).toThrow(/Specify at most/);
    expect(() => resolveHostType({ tunnel: true, lan: true })).toThrow(/Specify at most/);
  });
});

describe(resolvePortsAsync, () => {
  beforeEach(() => {
    jest
      .mocked(resolveMetroPortAsync)
      .mockImplementation(async (root, { defaultPort, fallbackPort } = {}) => {
        if (typeof defaultPort === 'string' && defaultPort) {
          return { kind: 'port', port: parseInt(defaultPort, 10) };
        } else if (typeof defaultPort === 'number' && defaultPort) {
          return { kind: 'port', port: defaultPort };
        }
        return fallbackPort
          ? { kind: 'port', port: fallbackPort }
          : { kind: 'declined', busyPort: 8081 };
      });
  });
  it(`resolves default port for metro`, async () => {
    await expect(resolvePortsAsync('/noop', {}, ['metro'])).resolves.toStrictEqual({
      metroPort: 8081,
    });
  });
  it(`resolves default port with given port`, async () => {
    await expect(resolvePortsAsync('/noop', { port: 1234 }, ['metro'])).resolves.toStrictEqual({
      metroPort: 1234,
    });
    await expect(
      resolvePortsAsync('/noop', { port: 1234, devClient: true }, ['metro'])
    ).resolves.toStrictEqual({
      metroPort: 1234,
    });
  });
  it(`resolves default port for metro with dev client`, async () => {
    await expect(resolvePortsAsync('/noop', { devClient: true }, ['metro'])).resolves.toStrictEqual(
      {
        metroPort: 8081,
      }
    );
  });
  it(`does not abort when port resolves to 0`, async () => {
    jest.mocked(resolveMetroPortAsync).mockResolvedValueOnce({ kind: 'port', port: 0 });
    await expect(resolvePortsAsync('/noop', { port: 0 }, ['metro'])).resolves.toStrictEqual({
      metroPort: 0,
    });
  });
  it(`resolves the webpack port from its own default, ignoring --port`, async () => {
    jest.mocked(choosePortAsync).mockResolvedValueOnce({ kind: 'port', port: 19006 });
    await expect(
      resolvePortsAsync('/noop', { port: 1234 }, ['metro', 'webpack'])
    ).resolves.toStrictEqual({
      metroPort: 1234,
      webpackPort: 19006,
    });
    // Web ignores `--port`, so the webpack port is resolved from its own default (19006).
    expect(choosePortAsync).toHaveBeenCalledWith(
      '/noop',
      expect.objectContaining({ defaultPort: 19006 })
    );
  });
});

describe('tunnel provider', () => {
  it.each([
    [{ '--tunnel': true }, 'tunnel', 'expo'],
    [{ '--tunnel': 'expo' }, 'tunnel', 'expo'],
    [{ '--tunnel': 'ngrok' }, 'tunnel', 'ngrok'],
    [{ '--host': 'tunnel' }, 'tunnel', 'expo'],
    [{}, 'lan', null],
    [{ '--tunnel': false }, 'lan', null],
    [{ '--tunnel': null }, 'lan', null],
    [{ '--tunnel': false, '--host': 'tunnel' }, 'tunnel', 'expo'],
    [{ '--tunnel': null, '--host': 'tunnel' }, 'tunnel', 'expo'],
    [{ '--host': 'localhost' }, 'localhost', null],
  ])('resolves %j', async (args, host, tunnelProvider) => {
    expect(await resolveOptionsAsync('/', args)).toMatchObject({
      host,
      tunnelProvider,
    });
  });

  it.each([true, 'expo', 'ngrok'])(
    'rejects combining --host tunnel with --tunnel %s',
    async (tunnel) => {
      await expect(
        resolveOptionsAsync('/', { '--host': 'tunnel', '--tunnel': tunnel })
      ).rejects.toThrow('Specify at most one of:');
    }
  );

  it('rejects unknown providers', async () => {
    await expect(resolveOptionsAsync('/', { '--tunnel': 'unknown' })).rejects.toThrow(
      'Invalid tunnel provider: unknown. Expected expo or ngrok.'
    );
  });

  it.each(['--offline', '--lan', '--localhost', '--host'])(
    'rejects combining ngrok with %s',
    async (flag) => {
      await expect(
        resolveOptionsAsync('/', {
          '--tunnel': 'ngrok',
          [flag]: flag === '--host' ? 'lan' : true,
        })
      ).rejects.toThrow('Specify at most one of:');
    }
  );
});

describe('WebContainer tunnel provider', () => {
  beforeEach(() => {
    jest.mocked(envIsWebcontainer).mockReturnValue(true);
  });

  afterEach(() => {
    jest.mocked(envIsWebcontainer).mockReturnValue(false);
  });

  it.each([
    [{}, 'tunnel', 'expo'],
    [{ '--host': 'tunnel' }, 'tunnel', 'expo'],
    [{ '--tunnel': 'ngrok' }, 'tunnel', 'ngrok'],
    [{ '--lan': true }, 'lan', null],
    [{ '--localhost': true }, 'localhost', null],
    [{ '--offline': true }, 'lan', null],
    [{ '--host': 'lan' }, 'lan', null],
  ])('resolves %j from the effective host', async (args, host, tunnelProvider) => {
    expect(await resolveOptionsAsync('/', args)).toMatchObject({ host, tunnelProvider });
  });
});
