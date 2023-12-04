import { vol } from 'memfs';

import { resolvePortAsync } from '../../utils/port';
import { resolveBundlerPropsAsync } from '../resolveBundlerProps';

jest.mock('../../utils/port');

describe(resolveBundlerPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`asserts bad args`, async () => {
    await expect(
      resolveBundlerPropsAsync('/', { bundler: false, port: 3000 })
    ).rejects.toThrowError(/mutually exclusive arguments/);
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
});
