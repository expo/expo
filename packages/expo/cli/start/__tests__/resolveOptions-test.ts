import { resolvePortAsync } from '../../utils/port';
import { resolveHostType, resolvePortsAsync } from '../resolveOptions';

const asMock = (fn: any): jest.Mock => fn as jest.Mock;

jest.mock('../../utils/port', () => {
  return {
    resolvePortAsync: jest.fn(),
  };
});

describe(resolveHostType, () => {
  it(`resolves no options`, () => {
    expect(resolveHostType({})).toBe('lan');
  });
  it(`resolves host type`, () => {
    expect(resolveHostType({ lan: true })).toBe('lan');
    expect(resolveHostType({ localhost: true })).toBe('localhost');
    expect(resolveHostType({ tunnel: true })).toBe('tunnel');
    expect(resolveHostType({ host: 'tunnel' })).toBe('tunnel');
    expect(resolveHostType({ offline: true })).toBe('localhost');
    expect(resolveHostType({ offline: true, lan: true })).toBe('lan');
    expect(resolveHostType({ offline: true, host: 'tunnel' })).toBe('tunnel');
  });
  it(`asserts invalid host type`, () => {
    expect(() => resolveHostType({ host: 'bacon' })).toThrow();
  });
  it(`asserts conflicting options`, () => {
    expect(() => resolveHostType({ localhost: true, host: 'lan' })).toThrow(/Specify at most/);
    expect(() => resolveHostType({ localhost: true, lan: true })).toThrow(/Specify at most/);
    expect(() => resolveHostType({ tunnel: true, lan: true })).toThrow(/Specify at most/);
  });
});

describe(resolvePortsAsync, () => {
  beforeEach(() => {
    asMock(resolvePortAsync).mockImplementation((root, { defaultPort, fallbackPort }) =>
      Promise.resolve(defaultPort ?? fallbackPort)
    );
  });
  it(`resolves default port for metro`, async () => {
    await expect(resolvePortsAsync('/noop', {}, { webOnly: false })).resolves.toStrictEqual({
      metroPort: 19000,
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
