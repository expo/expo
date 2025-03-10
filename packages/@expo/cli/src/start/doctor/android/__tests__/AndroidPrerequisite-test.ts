import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { confirmAsync } from '../../../../utils/prompts';
import { AndroidPrerequisite } from '../AndroidPrerequisite';

jest.mock(`../../../../log`);
jest.mock('../../../../utils/prompts');

it(`detects that adb is installed correctly`, async () => {
  jest.mocked(execSync).mockReset().mockReturnValueOnce(`Android Debug Bridge version 1.0.41`);

  jest
    .mocked(confirmAsync)
    .mockReset()
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await AndroidPrerequisite.instance.assertImplementation();
});

it(`asserts hints are shown when adb is not installed`, async () => {
  jest.mocked(spawnAsync).mockReset();

  jest
    .mocked(execSync)
    .mockReset()
    .mockImplementationOnce(() => {
      throw new Error('foobar');
    })
    .mockReturnValueOnce(`Android Debug Bridge version 1.0.41`);

  jest
    .mocked(confirmAsync)
    .mockReset()
    // Invoke the confirmation
    .mockResolvedValueOnce(false)
    .mockImplementation(() => {
      throw new Error("shouldn't happen");
    });

  await expect(AndroidPrerequisite.instance.assertImplementation()).rejects.toThrowError();
  expect(spawnAsync).not.toBeCalled();
});
