import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { asMock } from '../../../../__tests__/asMock';
import { confirmAsync } from '../../../../utils/prompts';
import { XcrunPrerequisite } from '../XcrunPrerequisite';

jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');

it(`detects that xcrun is installed and is valid`, async () => {
  // Mock xcrun installed for CI
  asMock(execSync).mockReset().mockReturnValueOnce(`xcrun version 60.`);

  // Ensure the confirmation is never called.
  asMock(confirmAsync)
    .mockReset()
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await XcrunPrerequisite.instance.assertImplementation();
});

it(`asserts that xcrun is not installed and installs it successfully`, async () => {
  asMock(spawnAsync).mockReset();
  // Mock xcrun installed for CI
  asMock(execSync)
    .mockReset()
    .mockImplementationOnce(() => {
      throw new Error('foobar');
    })
    .mockReturnValueOnce(`xcrun version 60.`);

  asMock(confirmAsync)
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
  asMock(spawnAsync).mockReset();
  // Mock xcrun installed for CI
  asMock(execSync)
    .mockReset()
    .mockImplementationOnce(() => {
      throw new Error('foobar');
    })
    .mockReturnValueOnce(`xcrun version 60.`);

  asMock(confirmAsync)
    .mockReset()
    // Invoke the confirmation
    .mockResolvedValueOnce(false)
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await expect(XcrunPrerequisite.instance.assertImplementation()).rejects.toThrowError();
  expect(spawnAsync).not.toBeCalled();
});
