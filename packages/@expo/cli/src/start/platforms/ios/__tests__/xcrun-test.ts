import spawnAsync from '@expo/spawn-async';

import { xcrunAsync } from '../xcrun';

it(`throws on invalid license`, async () => {
  // Mock Simulator.app installed for CI
  jest.mocked(spawnAsync).mockImplementationOnce(() => {
    // eslint-disable-next-line no-throw-literal
    throw {
      stderr: 'Xcode license is foobar',
    };
  });

  await expect(xcrunAsync(['simctl', 'help'])).rejects.toThrowError(
    /Xcode license is not accepted/
  );
  expect(spawnAsync).toBeCalledWith('xcrun', ['simctl', 'help'], undefined);
});

it(`throws on invalid setup`, async () => {
  // Mock Simulator.app installed for CI
  jest.mocked(spawnAsync).mockImplementationOnce(() => {
    // eslint-disable-next-line no-throw-literal
    throw {
      stderr: 'not a developer tool or in PATH',
    };
  });

  await expect(xcrunAsync(['simctl', 'help'])).rejects.toThrowError(/sudo xcode-select -s/);
});
