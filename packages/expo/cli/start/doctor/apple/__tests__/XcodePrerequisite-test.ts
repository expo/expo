import { execSync } from 'child_process';

import * as Log from '../../../../log';
import { confirmAsync } from '../../../../utils/prompts';
import { getXcodeVersionAsync, XcodePrerequisite } from '../XcodePrerequisite';

const asMock = (fn: any): jest.Mock => fn;

jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');
jest.mock('child_process', () => {
  return {
    execSync: jest.fn(),
  };
});

function mockXcodeInstalled() {
  return asMock(execSync).mockReturnValue(`Xcode 13.1
Build version 13A1030d`);
}

describe(getXcodeVersionAsync, () => {
  beforeEach(() => {
    jest.mock('../../../../log').resetAllMocks();
  });
  it(`returns the xcode version`, () => {
    mockXcodeInstalled();
    expect(getXcodeVersionAsync()).toEqual('13.1.0');
  });
  it(`logs an error when the xcode cli format is invalid`, () => {
    asMock(execSync).mockReturnValue(`foobar`);
    expect(getXcodeVersionAsync()).toEqual(null);
    expect(Log.error).toHaveBeenLastCalledWith(
      expect.stringMatching(/Unable to check Xcode version/)
    );
  });
  it(`returns null when the xcode command fails (not installed)`, () => {
    asMock(execSync).mockImplementationOnce(() => {
      throw new Error('foobar');
    });
    expect(getXcodeVersionAsync()).toEqual(null);
    expect(Log.error).not.toBeCalled();
  });
});

describe('assertAsync', () => {
  beforeEach(() => {
    jest.mock('../../../../utils/prompts').resetAllMocks();
  });

  it(`validates that Xcode is installed and is valid`, async () => {
    // Mock xcode installed for CI
    mockXcodeInstalled();

    // Ensure the confirmation is never called.
    asMock(confirmAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

    await XcodePrerequisite.instance.assertImplementation();
  });

  for (const { xcodeVersion, promptRegex, condition } of [
    {
      xcodeVersion: '',
      promptRegex: /Xcode needs to be installed/,
      condition: 'Xcode is not installed',
    },
    {
      xcodeVersion: '1.0',
      promptRegex: /needs to be updated to at least version/,
      condition: 'Xcode is outdated',
    },
  ]) {
    it(`Opens the app store when: ${condition}`, async () => {
      asMock(execSync)
        // Mock xcode is not installed.
        .mockImplementationOnce(() => {
          return `Xcode ${xcodeVersion}
Build version 13A1030d`;
        })
        // Skip actually opening the app store.
        .mockImplementationOnce((cmd) => {});

      asMock(confirmAsync)
        // Ensure the confirmation is selected.
        .mockImplementationOnce(() => true)
        // Prevent any extra calls.
        .mockImplementationOnce((cc) => {
          throw new Error("shouldn't happen");
        });

      await expect(XcodePrerequisite.instance.assertImplementation()).rejects.toThrow();

      expect(confirmAsync).toHaveBeenLastCalledWith({
        initial: true,
        message: expect.stringMatching(promptRegex),
      });
      // Opens the app store...
      expect(execSync).toHaveBeenLastCalledWith(
        'open macappstore://itunes.apple.com/app/id497799835',
        expect.anything()
      );
    });
  }
});
