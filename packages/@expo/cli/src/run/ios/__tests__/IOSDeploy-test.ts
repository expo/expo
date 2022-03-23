import spawnAsync from '@expo/spawn-async';

import { confirmAsync } from '../../../utils/prompts';
import { assertInstalledAsync } from '../IOSDeploy';

jest.mock('../../../utils/prompts');
const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

describe(assertInstalledAsync, () => {
  it(`does not install when the bin exists`, async () => {
    asMock(spawnAsync).mockResolvedValueOnce({} as any);

    await assertInstalledAsync();

    expect(spawnAsync).toBeCalledTimes(1);
  });

  it(`installs when missing`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(true);
    asMock(spawnAsync)
      .mockRejectedValueOnce(new Error('...'))
      .mockResolvedValueOnce({} as any);

    await assertInstalledAsync();

    expect(spawnAsync).toHaveBeenNthCalledWith(1, 'ios-deploy', ['--version'], expect.anything());
    expect(spawnAsync).toHaveBeenNthCalledWith(
      2,
      'brew',
      ['install', 'ios-deploy'],
      expect.anything()
    );
  });

  it(`asserts when missing and the user rejects the auto install prompt`, async () => {
    asMock(confirmAsync).mockResolvedValueOnce(false);
    asMock(spawnAsync)
      .mockRejectedValueOnce(new Error('...'))
      .mockResolvedValueOnce({} as any);

    await expect(assertInstalledAsync()).rejects.toThrow();

    expect(spawnAsync).toBeCalledTimes(1);
  });
});
