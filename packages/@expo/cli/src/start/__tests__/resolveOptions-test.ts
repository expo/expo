import { Log } from '../../log';
import { hasDirectDevClientDependency } from '../../utils/analytics/getDevClientProperties';
import { resolvePortAsync } from '../../utils/port';
import { getOptionalDevClientSchemeAsync } from '../../utils/scheme';
import { canResolveDevClient } from '../detectDevClient';
import {
  resolveSchemeAsync,
  resolveHostType,
  resolveOptionsAsync,
  resolvePortsAsync,
} from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../utils/port', () => {
  return {
    resolvePortAsync: jest.fn(),
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
jest.mock('../../utils/analytics/getDevClientProperties', () => {
  return {
    hasDirectDevClientDependency: jest.fn(() => false),
  };
});
jest.mock('../detectDevClient', () => {
  return {
    canResolveDevClient: jest.fn(async () => false),
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
    expect(canResolveDevClient).not.toBeCalled();
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
      .mocked(resolvePortAsync)
      .mockImplementation(async (root, { defaultPort, fallbackPort }) => {
        if (typeof defaultPort === 'string' && defaultPort) {
          return parseInt(defaultPort, 10);
        } else if (typeof defaultPort === 'number' && defaultPort) {
          return defaultPort;
        }
        return fallbackPort;
      });
  });
  it(`resolves default port for metro`, async () => {
    await expect(resolvePortsAsync('/noop', {}, { webOnly: false })).resolves.toStrictEqual({
      metroPort: 8081,
    });
  });
  it(`resolves default port with given port`, async () => {
    await expect(
      resolvePortsAsync('/noop', { port: 1234 }, { webOnly: false })
    ).resolves.toStrictEqual({
      metroPort: 1234,
    });
    await expect(
      resolvePortsAsync('/noop', { port: 1234, devClient: true }, { webOnly: false })
    ).resolves.toStrictEqual({
      metroPort: 1234,
    });
    await expect(
      resolvePortsAsync('/noop', { port: 1234 }, { webOnly: true })
    ).resolves.toStrictEqual({
      webpackPort: 1234,
    });
  });
  it(`resolves default port for metro with dev client`, async () => {
    await expect(
      resolvePortsAsync('/noop', { devClient: true }, { webOnly: false })
    ).resolves.toStrictEqual({
      metroPort: 8081,
    });
  });
  it(`resolves default port for webpack`, async () => {
    await expect(resolvePortsAsync('/noop', {}, { webOnly: true })).resolves.toStrictEqual({
      webpackPort: 19006,
    });
    // dev client changes nothing on Webpack...
    await expect(
      resolvePortsAsync('/noop', { devClient: true }, { webOnly: true })
    ).resolves.toStrictEqual({
      webpackPort: 19006,
    });
  });
});
