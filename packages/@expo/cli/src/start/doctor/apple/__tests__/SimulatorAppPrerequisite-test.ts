import { execAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import { SimulatorAppPrerequisite } from '../SimulatorAppPrerequisite';

jest.mock(`../../../../log`);
jest.mock('@expo/spawn-async');

beforeEach(() => {
  jest.mocked(execAsync).mockReset();
  jest.mocked(spawnAsync).mockReset();
});

it(`detects that Simulator.app is installed`, async () => {
  // Mock Simulator.app installed for CI
  jest.mocked(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  jest.mocked(spawnAsync).mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(execAsync).toHaveBeenCalledWith('id of app "Simulator"');
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`detects DeviceHub.app on Xcode 27`, async () => {
  // Xcode 27 dropped the standalone Simulator.app in favor of DeviceHub.app.
  jest
    .mocked(execAsync)
    // id of app "Simulator" — no longer registered on Xcode 27
    .mockRejectedValueOnce(new Error('not registered'))
    // id of app "DeviceHub"
    .mockResolvedValueOnce('com.apple.dt.Devices');
  jest.mocked(spawnAsync).mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(execAsync).toHaveBeenCalledWith('id of app "DeviceHub"');
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`falls back to reading DeviceHub.app Info.plist on Xcode 27`, async () => {
  // Neither app is registered in LaunchServices and Simulator.app no longer exists.
  jest.mocked(execAsync).mockRejectedValue(new Error('not registered'));
  jest
    .mocked(spawnAsync)
    // xcode-select --print-path
    .mockResolvedValueOnce({ stdout: '/Applications/Xcode.app/Contents/Developer\n' } as any)
    // defaults read … Simulator.app (gone on Xcode 27)
    .mockRejectedValueOnce(new Error('does not exist'))
    // defaults read … DeviceHub.app
    .mockResolvedValueOnce({ stdout: 'com.apple.dt.Devices\n' } as any)
    // xcrun simctl help
    .mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(spawnAsync).toHaveBeenCalledWith('defaults', [
    'read',
    expect.stringContaining('DeviceHub.app'),
    'CFBundleIdentifier',
  ]);
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`falls back to reading Info.plist when LaunchServices lookup fails`, async () => {
  // Simulate LaunchServices not having Simulator.app registered (e.g. Xcode on external volume).
  jest.mocked(execAsync).mockRejectedValueOnce(new Error('not registered'));
  jest
    .mocked(spawnAsync)
    // xcode-select --print-path
    .mockResolvedValueOnce({ stdout: '/Applications/Xcode.app/Contents/Developer\n' } as any)
    // defaults read … CFBundleIdentifier
    .mockResolvedValueOnce({ stdout: 'com.apple.iphonesimulator\n' } as any)
    // xcrun simctl help
    .mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(execAsync).toHaveBeenCalledWith('id of app "Simulator"');
  expect(spawnAsync).toHaveBeenCalledWith('xcode-select', ['--print-path']);
  expect(spawnAsync).toHaveBeenCalledWith('defaults', [
    'read',
    expect.stringContaining('Simulator.app'),
    'CFBundleIdentifier',
  ]);
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`throws when both LaunchServices and Info.plist fallback cannot find Simulator.app`, async () => {
  // Both lookups fail — Simulator really isn't available.
  jest.mocked(execAsync).mockRejectedValueOnce(new Error('not registered'));
  jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('xcode-select not found'));

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /Simulator is most likely not installed/
  );
  expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`asserts that Simulator.app is installed with invalid Simulator.app`, async () => {
  // Mock Simulator.app installed with invalid binary
  jest.mocked(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.bacon`);
  jest.mocked(spawnAsync).mockReset();

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(/\.bacon/);
  expect(spawnAsync).not.toHaveBeenCalled();
});

it(`asserts that Simulator.app is installed but simctl doesn't work`, async () => {
  // Mock Simulator.app installed for CI
  jest.mocked(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  jest.mocked(spawnAsync).mockImplementationOnce(() => {
    throw new Error('foobar');
  });

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /xcrun is not configured correctly/
  );
});
