import { vol } from 'memfs';

import { resolveMetroPortAsync } from '../../utils/port';
import { resolveBundlerPropsAsync } from '../resolveBundlerProps';

jest.mock('../../utils/port');

describe(resolveBundlerPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`asserts bad args`, async () => {
    await expect(resolveBundlerPropsAsync('/', { bundler: false, port: 3000 })).rejects.toThrow(
      /mutually exclusive arguments/
    );
  });
  it(`ignores an invalid port when the bundler is skipped`, async () => {
    expect(await resolveBundlerPropsAsync('/', { bundler: false, port: NaN })).toEqual({
      port: 8081,
      shouldStartBundler: false,
    });
  });
  it(`ignores an invalid port when the bundler is started`, async () => {
    expect(await resolveBundlerPropsAsync('/', { port: NaN })).toEqual({
      port: 8081,
      shouldStartBundler: true,
    });
  });
  it(`skips bundling if the port is busy`, async () => {
    jest.mocked(resolveMetroPortAsync).mockResolvedValueOnce(null);

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
    jest.mocked(resolveMetroPortAsync).mockResolvedValueOnce(19006);

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
