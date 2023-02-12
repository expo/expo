import { execAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import { asMock } from '../../../../__tests__/asMock';
import { SimulatorAppPrerequisite } from '../SimulatorAppPrerequisite';

jest.mock(`../../../../log`);

it(`detects that Simulator.app is installed`, async () => {
  // Mock Simulator.app installed for CI
  asMock(execAsync)
    .mockReset()
    .mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  asMock(spawnAsync)
    .mockReset()
    .mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(execAsync).toBeCalledWith('id of app "Simulator"');
  expect(spawnAsync).toBeCalledWith('xcrun', ['simctl', 'help']);
});

it(`asserts that Simulator.app is installed with invalid Simulator.app`, async () => {
  // Mock Simulator.app installed with invalid binary
  asMock(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.bacon`);
  asMock(spawnAsync).mockReset();

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(/\.bacon/);
  expect(spawnAsync).not.toBeCalled();
});

it(`asserts that Simulator.app is installed but simctl doesn't work`, async () => {
  // Mock Simulator.app installed for CI
  asMock(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  asMock(spawnAsync).mockImplementationOnce(() => {
    throw new Error('foobar');
  });

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /xcrun is not configured correctly/
  );
});
