import { execSync } from 'child_process';

import * as Log from '../../../../log';
import { confirmAsync } from '../../../../utils/prompts';
import { getXcodeVersionAsync, XcodePrerequisite } from '../XcodePrerequisite';

jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');

function mockXcodeInstalled() {
  return jest.mocked(execSync).mockReturnValue(`Xcode 14.3
Build version 14E222b`);
}

describe(getXcodeVersionAsync, () => {
  beforeEach(() => {
    jest.mocked(Log.error).mockReset();
  });
  it(`returns the xcode version`, () => {
    mockXcodeInstalled();
    expect(getXcodeVersionAsync()).toEqual('14.3.0');
  });
  it(`logs an error when the xcode cli format is invalid`, () => {
    jest.mocked(execSync).mockReturnValue(`foobar`);
    expect(getXcodeVersionAsync()).toEqual(null);
    expect(Log.error).toHaveBeenLastCalledWith(
      expect.stringMatching(/Unable to check Xcode version/)
    );
  });
  it(`returns null when the xcode command fails (not installed)`, () => {
    jest.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('foobar');
    });
    expect(getXcodeVersionAsync()).toEqual(null);
    expect(Log.error).not.toBeCalled();
  });
});

const platform = process.platform;

const mockPlatform = (value: string) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

afterEach(() => {
  mockPlatform(platform);
});

it(`validates that Xcode is installed and is valid`, async () => {
  // Mock xcode installed for CI
  mockXcodeInstalled();

  // Ensure the confirmation is never called.
  jest
    .mocked(confirmAsync)
    .mockReset()
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await XcodePrerequisite.instance.assertImplementation();
});

for (const platform of ['darwin', 'win32']) {
  describe(platform, () => {
    for (const { xcodeVersion, promptRegex, condition } of [
      {
        xcodeVersion: '',
        promptRegex: /Xcode must be fully installed before you can continue/,
        condition: 'Xcode is not installed',
      },
      {
        xcodeVersion: '1.0',
        promptRegex: /needs to be updated to at least version/,
        condition: 'Xcode is outdated',
      },
    ]) {
      it(`opens the app store when: ${condition}`, async () => {
        mockPlatform(platform);
        jest
          .mocked(execSync)
          // Mock xcode is not installed.
          .mockImplementationOnce(() => {
            return `Xcode ${xcodeVersion}
Build version 13A1030d`;
          })
          // Skip actually opening the app store.
          .mockImplementationOnce((cmd) => '');

        jest
          .mocked(confirmAsync)
          .mockReset()
          // Ensure the confirmation is selected.
          .mockImplementationOnce(async () => true)
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
          platform === 'darwin'
            ? 'open macappstore://itunes.apple.com/app/id497799835'
            : 'open https://apps.apple.com/us/app/id497799835',
          expect.anything()
        );
      });
    }
  });
}
