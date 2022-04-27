import { vol } from 'memfs';

import { resolveBundlerPropsAsync } from '../resolveBundlerProps';

jest.mock('../../utils/port', () => ({
  resolvePortAsync: jest.fn(
    async (root, { defaultPort, fallbackPort }) => defaultPort ?? fallbackPort
  ),
}));

describe(resolveBundlerPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`asserts bad args`, async () => {
    await expect(
      resolveBundlerPropsAsync('/', { bundler: false, port: 3000 })
    ).rejects.toThrowError(/mutually exclusive arguments/);
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
    expect(
      await resolveBundlerPropsAsync('/', {
        bundler: true,
      })
    ).toEqual({
      port: 8081,
      shouldStartBundler: true,
    });
  });
});
