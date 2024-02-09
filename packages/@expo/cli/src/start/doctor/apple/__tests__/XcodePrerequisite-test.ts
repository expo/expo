import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import * as Log from '../../../../log';
import { confirmAsync } from '../../../../utils/prompts';
import { getXcodeVersionAsync, XcodePrerequisite } from '../XcodePrerequisite';

jest.mock('@expo/spawn-async');
jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');

function mockXcodeInstalled() {
  return jest.mocked(spawnAsync).mockResolvedValueOnce({
    stdout: `Xcode 14.3
  Build version 14E222b`,
  });
}

describe(getXcodeVersionAsync, () => {
  beforeEach(() => {
    jest.mocked(Log.warn).mockReset();
  });
  it(`returns the xcode version`, async () => {
    mockXcodeInstalled();
    expect(await getXcodeVersionAsync({ force: true })).toEqual('14.3.0');
  });
  it(`logs an error when the xcode cli format is invalid`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ stdout: `foobar` });
    expect(await getXcodeVersionAsync({ force: true })).toEqual(null);
    expect(Log.warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/Unable to check Xcode version/)
    );
  });
  it(`returns null when the xcode command fails (not installed)`, async () => {
    jest.mocked(spawnAsync).mockImplementationOnce(() => {
      throw new Error('foobar');
    });
    expect(await getXcodeVersionAsync({ force: true })).toEqual(null);
    expect(Log.warn).not.toBeCalled();
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
          .mocked(spawnAsync)
          // Mock xcode is not installed.
          .mockResolvedValueOnce({
            stdout: `Xcode ${xcodeVersion}
          Build version 13A1030d`,
          });
        jest
          .mocked(execSync)
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
