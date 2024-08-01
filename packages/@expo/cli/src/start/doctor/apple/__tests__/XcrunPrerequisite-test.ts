import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { confirmAsync } from '../../../../utils/prompts';
import { XcrunPrerequisite } from '../XcrunPrerequisite';

jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');

it(`detects that xcrun is installed and is valid`, async () => {
  // Mock xcrun installed for CI
  jest.mocked(execSync).mockReset().mockReturnValueOnce(`xcrun version 64.`);

  // Ensure the confirmation is never called.
  jest
    .mocked(confirmAsync)
    .mockReset()
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await XcrunPrerequisite.instance.assertImplementation();
});

it(`asserts that xcrun is not installed and installs it successfully`, async () => {
  jest.mocked(spawnAsync).mockReset();
  // Mock xcrun installed for CI
  jest
    .mocked(execSync)
    .mockReset()
    .mockImplementationOnce(() => {
      throw new Error('foobar');
    })
    .mockReturnValueOnce(`xcrun version 64.`);

  jest
    .mocked(confirmAsync)
    .mockReset()
    // Invoke the confirmation
    .mockResolvedValueOnce(true)
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await XcrunPrerequisite.instance.assertImplementation();
  // await expect(XcrunPrerequisite.instance.assertImplementation()).rejects.toThrowError();
  expect(spawnAsync).toBeCalledWith('sudo', ['xcode-select', '--install']);
});

it(`asserts that xcrun is not installed and the user cancels`, async () => {
  jest.mocked(spawnAsync).mockReset();
  // Mock xcrun installed for CI
  jest
    .mocked(execSync)
    .mockReset()
    .mockImplementationOnce(() => {
      throw new Error('foobar');
    })
    .mockReturnValueOnce(`xcrun version 64.`);

  jest
    .mocked(confirmAsync)
    .mockReset()
    // Invoke the confirmation
    .mockResolvedValueOnce(false)
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await expect(XcrunPrerequisite.instance.assertImplementation()).rejects.toThrowError();
  expect(spawnAsync).not.toBeCalled();
});
