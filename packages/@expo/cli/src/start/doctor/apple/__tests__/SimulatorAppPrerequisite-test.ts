import { safeIdOfAppAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';

import { SimulatorAppPrerequisite } from '../SimulatorAppPrerequisite';

jest.mock(`../../../../log`);
jest.mock('@expo/spawn-async');

beforeEach(() => {
  jest.mocked(safeIdOfAppAsync).mockReset();
  jest.mocked(spawnAsync).mockReset();
});

it('detects DeviceHub.app from Apple scripts', async () => {
  jest
    .mocked(safeIdOfAppAsync)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce('com.apple.dt.Devices');
  jest.mocked(spawnAsync).mockResolvedValue({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(safeIdOfAppAsync).toHaveBeenCalledWith('Simulator');
  expect(safeIdOfAppAsync).toHaveBeenCalledWith('DeviceHub');
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it('detects DeviceHub.app from LaunchServices', async () => {
  jest.mocked(safeIdOfAppAsync).mockResolvedValue(null);
  jest
    .mocked(spawnAsync)
    // xcode-select --print-path
    .mockResolvedValueOnce({ stdout: '/Applications/Xcode.app/Contents/Developer\n' } as any)
    // defaults read …/Simulator.app/… CFBundleIdentifier
    .mockRejectedValueOnce({ stderr: 'The domain/default par of ... does not exist' } as any)
    // defaults read …/DeviceHub.app/… CFBundleIdentifier
    .mockResolvedValueOnce({ stdout: 'com.apple.dt.Devices\n' } as any)
    // xcrun simctl help
    .mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(safeIdOfAppAsync).toHaveBeenCalledWith('Simulator');
  expect(safeIdOfAppAsync).toHaveBeenCalledWith('DeviceHub');
  expect(spawnAsync).toHaveBeenCalledWith('defaults', [
    'read',
    expect.stringContaining('/Developer/Applications/Simulator.app/Contents/Info.plist'),
    'CFBundleIdentifier',
  ]);
  expect(spawnAsync).toHaveBeenCalledWith('defaults', [
    'read',
    expect.stringContaining('/Applications/DeviceHub.app/Contents/Info.plist'),
    'CFBundleIdentifier',
  ]);
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`detects Simulator.app from Apple scripts`, async () => {
  jest
    .mocked(safeIdOfAppAsync)
    .mockResolvedValueOnce('com.apple.CoreSimulator.SimulatorTrampoline');
  jest.mocked(spawnAsync).mockResolvedValue({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(safeIdOfAppAsync).toHaveBeenCalledWith('Simulator');
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`detects Simulator.app from LaunchServices`, async () => {
  // Simulate LaunchServices not having Simulator.app registered (e.g. Xcode on external volume).
  jest.mocked(safeIdOfAppAsync).mockResolvedValue(null);
  jest
    .mocked(spawnAsync)
    // xcode-select --print-path
    .mockResolvedValueOnce({ stdout: '/Applications/Xcode.app/Contents/Developer\n' } as any)
    // defaults read …/Simulator.app/… CFBundleIdentifier
    .mockResolvedValueOnce({ stdout: 'com.apple.iphonesimulator\n' } as any)
    // xcrun simctl help
    .mockResolvedValueOnce({} as any);

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(safeIdOfAppAsync).toHaveBeenCalledWith('Simulator');
  expect(spawnAsync).toHaveBeenCalledWith('defaults', [
    'read',
    '/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/Contents/Info.plist',
    'CFBundleIdentifier',
  ]);
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`throws when no simulator app identifier was found`, async () => {
  // Both lookups fail — Simulator really isn't available.
  jest.mocked(safeIdOfAppAsync).mockResolvedValue(null);
  jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('xcode-select not found'));

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /Device Hub or Simulator is most likely not installed/
  );

  expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`asserts that simulator is installed with invalid bundle identifier`, async () => {
  // Mock Simulator.app installed with invalid binary
  jest.mocked(safeIdOfAppAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.custom`);

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /\.CoreSimulator\.custom/
  );

  expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it(`asserts that simulator is installed but simctl doesn't work`, async () => {
  // Mock Simulator.app installed for CI
  jest
    .mocked(safeIdOfAppAsync)
    .mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
  jest.mocked(spawnAsync).mockImplementationOnce(() => {
    throw new Error('foobar');
  });

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /xcrun is not configured correctly/
  );

  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});
