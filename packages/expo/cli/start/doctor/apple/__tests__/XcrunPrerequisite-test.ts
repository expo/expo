import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { confirmAsync } from '../../../../utils/prompts';
import { XcrunPrerequisite } from '../XcrunPrerequisite';

const asMock = (fn: any): jest.Mock => fn;

jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');
jest.mock('child_process', () => {
  return {
    execSync: jest.fn(),
  };
});
jest.mock(`@expo/spawn-async`, () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({})),
}));

beforeEach(() => {
  jest.mock('../../../../utils/prompts').resetAllMocks();
  jest.mock('@expo/spawn-async').resetAllMocks();
});

describe('assertAsync', () => {
  it(`detects that xcrun is installed and is valid`, async () => {
    // Mock xcrun installed for CI
    asMock(execSync).mockReturnValueOnce(`xcrun version 60.`);

    // Ensure the confirmation is never called.
    asMock(confirmAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

    await XcrunPrerequisite.instance.assertImplementation();
  });

  it(`asserts that xcrun is not installed and installs it successfully`, async () => {
    // Mock xcrun installed for CI
    asMock(execSync)
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      })
      .mockReturnValueOnce(`xcrun version 60.`);

    asMock(confirmAsync)
      // Invoke the confirmation
      .mockReturnValueOnce(true)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await XcrunPrerequisite.instance.assertImplementation();
    // await expect(XcrunPrerequisite.instance.assertImplementation()).rejects.toThrowError();
    expect(spawnAsync).toBeCalledWith('sudo', ['xcode-select', '--install']);
  });

  it(`asserts that xcrun is not installed and the user cancels`, async () => {
    // Mock xcrun installed for CI
    asMock(execSync)
      .mockImplementationOnce(() => {
        throw new Error('foobar');
      })
      .mockReturnValueOnce(`xcrun version 60.`);

    asMock(confirmAsync)
      // Invoke the confirmation
      .mockReturnValueOnce(false)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await expect(XcrunPrerequisite.instance.assertImplementation()).rejects.toThrowError();
    expect(spawnAsync).not.toBeCalled();
  });
});
