import { safeIdOfAppAsync } from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import semverCoerce from 'semver/functions/coerce';

import { XcodePrerequisite } from '../XcodePrerequisite';
import { XcodeSimulatorPrerequisite } from '../XcodeSimulatorPrerequisite';

jest.mock('@expo/spawn-async');
jest.mock(`../../../../log`);

beforeEach(() => {
  jest.mocked(safeIdOfAppAsync).mockReset();
  jest.mocked(spawnAsync).mockReset();
});

describe('xcode 27+', () => {
  beforeAll(() => {
    jest.spyOn(XcodePrerequisite.instance, 'assertAsync').mockResolvedValue({
      version: semverCoerce('27.0.0')!,
      path: '/Applications/Xcode.app/Contents/Developer',
    });
  });

  it(`detects that DeviceHub.app is installed via osascript`, async () => {
    // osascript -e 'id of app "DeviceHub"'
    jest.mocked(safeIdOfAppAsync).mockResolvedValueOnce(`com.apple.dt.Devices`)
    // xcrun simctl help
    jest.mocked(spawnAsync).mockResolvedValueOnce({} as any);

    await XcodeSimulatorPrerequisite.instance.assertImplementation();

    expect(safeIdOfAppAsync).toHaveBeenCalledWith('DeviceHub');
    expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
  });

  it(`detects that DeviceHub.app is installed via xcode path`, async () => {
    // osascript -e 'id of app "DeviceHub"'
    jest.mocked(safeIdOfAppAsync).mockResolvedValueOnce(null);
    // defaults read /Applications/Xcode.app/Contents/Applications/DeviceHub.app/Contents/Info.plist CFBundleIdentifier
    jest.mocked(spawnAsync).mockResolvedValueOnce({ status: 0, stdout: `com.apple.dt.Devices\n` } as any);
    // xcrun simctl help
    jest.mocked(spawnAsync).mockResolvedValueOnce({} as any);

    await XcodeSimulatorPrerequisite.instance.assertImplementation();

    expect(spawnAsync).toHaveBeenCalledWith('defaults', ['read', '/Applications/Xcode.app/Contents/Applications/DeviceHub.app/Contents/Info.plist', 'CFBundleIdentifier']);
    expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
  });
});

// xit(`detects that Simulator.app is installed`, async () => {
//   // Mock Simulator.app installed for CI
//   jest.mocked(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
//   jest.mocked(spawnAsync).mockResolvedValueOnce({} as any);

//   await XcodeSimulatorPrerequisite.instance.assertImplementation();

//   expect(execAsync).toHaveBeenCalledWith('id of app "Simulator"');
//   expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
// });

// xit(`falls back to reading Info.plist when LaunchServices lookup fails`, async () => {
//   // Simulate LaunchServices not having Simulator.app registered (e.g. Xcode on external volume).
//   jest.mocked(execAsync).mockRejectedValueOnce(new Error('not registered'));
//   jest
//     .mocked(spawnAsync)
//     // xcode-select --print-path
//     .mockResolvedValueOnce({ stdout: '/Applications/Xcode.app/Contents/Developer\n' } as any)
//     // defaults read … CFBundleIdentifier
//     .mockResolvedValueOnce({ stdout: 'com.apple.iphonesimulator\n' } as any)
//     // xcrun simctl help
//     .mockResolvedValueOnce({} as any);

//   await XcodeSimulatorPrerequisite.instance.assertImplementation();

//   expect(execAsync).toHaveBeenCalledWith('id of app "Simulator"');
//   expect(spawnAsync).toHaveBeenCalledWith('xcode-select', ['--print-path']);
//   expect(spawnAsync).toHaveBeenCalledWith('defaults', [
//     'read',
//     expect.stringContaining('Simulator.app'),
//     'CFBundleIdentifier',
//   ]);
//   expect(spawnAsync).toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
// });

// xit(`throws when both LaunchServices and Info.plist fallback cannot find Simulator.app`, async () => {
//   // Both lookups fail — Simulator really isn't available.
//   jest.mocked(execAsync).mockRejectedValueOnce(new Error('not registered'));
//   jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('xcode-select not found'));

//   await expect(XcodeSimulatorPrerequisite.instance.assertImplementation()).rejects.toThrow(
//     /Simulator is most likely not installed/
//   );
//   expect(spawnAsync).not.toHaveBeenCalledWith('xcrun', ['simctl', 'help']);
// });

// xit(`asserts that Simulator.app is installed with invalid Simulator.app`, async () => {
//   // Mock Simulator.app installed with invalid binary
//   jest.mocked(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.bacon`);
//   jest.mocked(spawnAsync).mockReset();

//   await expect(XcodeSimulatorPrerequisite.instance.assertImplementation()).rejects.toThrow(/\.bacon/);
//   expect(spawnAsync).not.toHaveBeenCalled();
// });

// xit(`asserts that Simulator.app is installed but simctl doesn't work`, async () => {
//   // Mock Simulator.app installed for CI
//   jest.mocked(execAsync).mockResolvedValueOnce(`com.apple.CoreSimulator.SimulatorTrampoline`);
//   jest.mocked(spawnAsync).mockImplementationOnce(() => {
//     throw new Error('foobar');
//   });

//   await expect(XcodeSimulatorPrerequisite.instance.assertImplementation()).rejects.toThrow(
//     /xcrun is not configured correctly/
//   );
// });
