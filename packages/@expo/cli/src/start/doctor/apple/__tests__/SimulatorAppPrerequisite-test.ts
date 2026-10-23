import { safeIdOfAppAsync } from '@expo/osascript';
import spawnAsync, { SpawnResult } from '@expo/spawn-async';

import { SimulatorAppPrerequisite } from '../SimulatorAppPrerequisite';

jest.mock(`../../../../log`);
jest.mock('@expo/spawn-async');

function successfulResult(stdout = ''): SpawnResult {
  return { output: [], stdout, stderr: '', status: 0, signal: null };
}

beforeEach(() => {
  jest.mocked(safeIdOfAppAsync).mockReset().mockResolvedValue(null);
  jest.mocked(spawnAsync).mockReset();
});

afterEach(() => {
  // Looking up an absent app by name opens macOS's application chooser.
  expect(safeIdOfAppAsync).not.toHaveBeenCalled();
});

it('detects DeviceHub.app in the selected Xcode installation without asking to locate Simulator', async () => {
  jest
    .mocked(spawnAsync)
    .mockResolvedValueOnce(successfulResult('/Applications/Xcode-beta.app/Contents/Developer\n'))
    .mockRejectedValueOnce(new Error('Simulator.app is not installed'))
    .mockResolvedValueOnce(successfulResult('com.apple.dt.Devices\n'))
    .mockResolvedValueOnce(successfulResult());

  await SimulatorAppPrerequisite.instance.assertImplementation();

  expect(spawnAsync).toHaveBeenCalledWith('defaults', [
    'read',
    '/Applications/Xcode-beta.app/Contents/Applications/DeviceHub.app/Contents/Info.plist',
    'CFBundleIdentifier',
  ]);
  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it.each(['com.apple.iphonesimulator', 'com.apple.CoreSimulator.SimulatorTrampoline'])(
  'detects Simulator.app with bundle identifier %s in the selected Xcode installation',
  async (appId) => {
    jest
      .mocked(spawnAsync)
      .mockResolvedValueOnce(
        successfulResult('/Volumes/External/Xcode 26.app/Contents/Developer\n')
      )
      .mockResolvedValueOnce(successfulResult(`${appId}\n`))
      .mockResolvedValueOnce(successfulResult());

    await SimulatorAppPrerequisite.instance.assertImplementation();

    expect(spawnAsync).toHaveBeenCalledWith('defaults', [
      'read',
      '/Volumes/External/Xcode 26.app/Contents/Developer/Applications/Simulator.app/Contents/Info.plist',
      'CFBundleIdentifier',
    ]);
    expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
  }
);

it('throws when the selected Xcode installation cannot be determined', async () => {
  jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('xcode-select not found'));

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /Device Hub or Simulator is most likely not installed/
  );

  expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it('throws when neither Simulator.app nor DeviceHub.app is installed', async () => {
  jest
    .mocked(spawnAsync)
    .mockResolvedValueOnce(successfulResult('/Applications/Xcode.app/Contents/Developer\n'))
    .mockRejectedValueOnce(new Error('Simulator.app is not installed'))
    .mockRejectedValueOnce(new Error('DeviceHub.app is not installed'));

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /Device Hub or Simulator is most likely not installed/
  );

  expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it('rejects an invalid simulator bundle identifier', async () => {
  jest
    .mocked(spawnAsync)
    .mockResolvedValueOnce(successfulResult('/Applications/Xcode.app/Contents/Developer\n'))
    .mockResolvedValueOnce(successfulResult('com.apple.CoreSimulator.custom\n'));

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /\.CoreSimulator\.custom/
  );

  expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});

it("rejects an installation where simctl doesn't work", async () => {
  jest
    .mocked(spawnAsync)
    .mockResolvedValueOnce(successfulResult('/Applications/Xcode.app/Contents/Developer\n'))
    .mockResolvedValueOnce(successfulResult('com.apple.iphonesimulator\n'))
    .mockRejectedValueOnce(new Error('simctl failed'));

  await expect(SimulatorAppPrerequisite.instance.assertImplementation()).rejects.toThrow(
    /xcrun is not configured correctly/
  );

  expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
});
