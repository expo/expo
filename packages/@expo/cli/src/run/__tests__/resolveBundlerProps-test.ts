import { vol } from 'memfs';

import { resolvePortAsync } from '../../utils/port';
import { resolveBundlerPropsAsync } from '../resolveBundlerProps';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../utils/port');

describe(resolveBundlerPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`asserts bad args`, async () => {
    await expect(
      resolveBundlerPropsAsync('/', { bundler: false, port: 3000 })
    ).rejects.toThrowError(/mutually exclusive arguments/);
  });
  it(`skips bundling if the port is busy`, async () => {
    asMock(resolvePortAsync).mockResolvedValueOnce(null);

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
    asMock(resolvePortAsync).mockResolvedValueOnce(19006);

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
