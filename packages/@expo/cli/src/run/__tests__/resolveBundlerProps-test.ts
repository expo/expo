import { vol } from 'memfs';

import { resolvePortAsync } from '../../utils/port';
import { resolveBundlerPropsAsync } from '../resolveBundlerProps';

jest.mock('../../utils/port');
jest.mock('../../utils/env', () => ({
  env: {},
}));

describe(resolveBundlerPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`asserts bad args`, async () => {
    await expect(resolveBundlerPropsAsync('/', { bundler: false, port: 3000 })).rejects.toThrow(
      /mutually exclusive arguments/
    );
  });
  it(`skips bundling if the port is busy`, async () => {
    jest.mocked(resolvePortAsync).mockResolvedValueOnce(null);

    expect(await resolveBundlerPropsAsync('/', {})).toEqual({
      port: 8081,
      shouldStartBundler: false,
    });
  });
  it(`resolves headless port`, async () => {
    expect(
      await resolveBundlerPropsAsync('/', {
        port: 3000,
      })
    ).toEqual({
      port: 3000,
      shouldStartBundler: true,
    });
  });
  it(`resolves default port`, async () => {
    jest.mocked(resolvePortAsync).mockResolvedValueOnce(19006);

    expect(
      await resolveBundlerPropsAsync('/', {
        bundler: true,
      })
    ).toEqual({
      port: 19006,
      shouldStartBundler: true,
    });
  });
  it(`uses RCT_METRO_PORT env when bundler is skipped`, async () => {
    jest.mocked(resolvePortAsync).mockResolvedValueOnce(null);

    const { env } = require('../../utils/env');
    const originalRCT_METRO_PORT = env.RCT_METRO_PORT;
    env.RCT_METRO_PORT = 8082;

    try {
      expect(
        await resolveBundlerPropsAsync('/', {
          bundler: true,
        })
      ).toEqual({
        port: 8082,
        shouldStartBundler: false,
      });
    } finally {
      env.RCT_METRO_PORT = originalRCT_METRO_PORT;
    }
  });
});
