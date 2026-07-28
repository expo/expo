import { resolvePortsAsync } from '../resolveOptions';
import type { PlatformBundlers } from '../server/platformBundlers';
import { _getMultiBundlerStartOptions } from '../startAsync';

jest.mock('../resolveOptions', () => ({
  resolvePortsAsync: jest.fn(async () => ({ metroPort: 8081, webpackPort: 19006 })),
}));

const NATIVE_METRO_WEB_WEBPACK: PlatformBundlers = {
  ios: 'metro',
  android: 'metro',
  tvos: 'metro',
  macos: 'metro',
  web: 'webpack',
};

describe(_getMultiBundlerStartOptions, () => {
  it(`resolves the web port even when web isn't started`, async () => {
    const [, startOptions, webPort] = await _getMultiBundlerStartOptions(
      '/',
      { web: false } as any,
      { ...NATIVE_METRO_WEB_WEBPACK }
    );

    expect(resolvePortsAsync).toHaveBeenCalledWith('/', expect.anything(), ['metro', 'webpack']);
    expect(startOptions).toEqual([
      { type: 'metro', options: expect.objectContaining({ port: 8081 }) },
    ]);
    expect(webPort).toBe(19006);
  });

  it(`starts both bundlers with --web`, async () => {
    const [, startOptions] = await _getMultiBundlerStartOptions('/', { web: true } as any, {
      ...NATIVE_METRO_WEB_WEBPACK,
    });

    expect(startOptions).toEqual([
      { type: 'metro', options: expect.objectContaining({ port: 8081 }) },
      { type: 'webpack', options: expect.objectContaining({ port: 19006 }) },
    ]);
  });
});
