import type { ExpoConfig } from '@expo/config';
import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import Module from 'module';
import path from 'path';

import { Log } from '../../log';
import {
  assertNoSwiftPMMarker,
  getSwiftPMMarkerPath,
  isSwiftPMEnabled,
  setupSwiftPMAsync,
} from '../setupSwiftPM';

jest.mock('../../log');

const projectRoot = '/app';
const localScript = `${projectRoot}/node_modules/react-native/scripts/setup-apple-spm.js`;
const configCommandJson =
  '["node","--no-warnings","--eval","require(\'expo/bin/autolinking\')","expo-modules-autolinking","react-native-config","--json","--platform","ios"]';
const quotedConfigCommand = `'["node","--no-warnings","--eval","require('\\''expo/bin/autolinking'\\'')","expo-modules-autolinking","react-native-config","--json","--platform","ios"]'`;
const addArgs = ['add', '--deintegrate', '--yes', '--config-command', configCommandJson];
const updateArgs = ['update', '--yes', '--config-command', configCommandJson];
const printedNodeScript = 'node node_modules/react-native/scripts/setup-apple-spm.js';
const printedAddCommand = `${printedNodeScript} add --deintegrate --yes --config-command ${quotedConfigCommand}`;
const marker = `${projectRoot}/ios/App.xcodeproj/.spm-injected.json`;

const loggedOutput = () =>
  jest
    .mocked(Log.log)
    .mock.calls.map((args) => args.join(' '))
    .join('\n');

const expectSpawnedScriptWith = (args: string[]) =>
  expect(jest.mocked(spawnAsync).mock.calls).toEqual([
    [process.execPath, [localScript, ...args], expect.objectContaining({ cwd: projectRoot })],
  ]);

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const setPlatform = (platform: NodeJS.Platform) =>
  Object.defineProperty(process, 'platform', { ...originalPlatform, value: platform });

let createRequire: jest.SpyInstance;

function mockReactNativeAt(reactNativeDir: string | null) {
  createRequire.mockReturnValue({
    resolve: (id: string) => {
      if (reactNativeDir && id === 'react-native/package.json') {
        return path.join(reactNativeDir, 'package.json');
      }
      throw new Error(`Cannot find module '${id}'`);
    },
  });
}

beforeEach(() => {
  setPlatform('darwin');
  createRequire = jest.spyOn(Module, 'createRequire');
  mockReactNativeAt(`${projectRoot}/node_modules/react-native`);
  vol.fromJSON({
    [`${projectRoot}/package.json`]: '{}',
    [`${projectRoot}/ios/App.xcodeproj/project.pbxproj`]: '',
    [localScript]: '',
  });
  jest.mocked(spawnAsync).mockReset();
});

afterEach(() => {
  Object.defineProperty(process, 'platform', originalPlatform);
  createRequire.mockRestore();
  vol.reset();
});

describe(getSwiftPMMarkerPath, () => {
  it(`returns the marker inside the Xcode project`, () => {
    vol.writeFileSync(marker, '{}');
    expect(getSwiftPMMarkerPath(projectRoot)).toBe(marker);
  });

  it(`returns null when the Xcode project has no marker`, () => {
    expect(getSwiftPMMarkerPath(projectRoot)).toBeNull();
  });

  it(`returns null when there is no ios directory`, () => {
    vol.reset();
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
    expect(getSwiftPMMarkerPath(projectRoot)).toBeNull();
  });

  it(`ignores markers outside an Xcode project`, () => {
    vol.writeFileSync(`${projectRoot}/ios/.spm-injected.json`, '{}');
    vol.mkdirSync(`${projectRoot}/ios/Pods`, { recursive: true });
    vol.writeFileSync(`${projectRoot}/ios/Pods/.spm-injected.json`, '{}');
    expect(getSwiftPMMarkerPath(projectRoot)).toBeNull();
  });
});

describe(isSwiftPMEnabled, () => {
  const configWithExperiments = (experiments: object) =>
    ({ name: 'App', slug: 'app', experiments }) as ExpoConfig;

  it(`returns true when experiments.swiftPackageManager is true`, () => {
    expect(isSwiftPMEnabled(configWithExperiments({ swiftPackageManager: true }))).toBe(true);
  });

  it(`returns false when experiments.swiftPackageManager is not exactly true`, () => {
    expect(isSwiftPMEnabled({ name: 'App', slug: 'app' })).toBe(false);
    expect(isSwiftPMEnabled(configWithExperiments({}))).toBe(false);
    expect(isSwiftPMEnabled(configWithExperiments({ swiftPackageManager: false }))).toBe(false);
    expect(isSwiftPMEnabled(configWithExperiments({ swiftPackageManager: 'true' }))).toBe(false);
  });
});

describe(assertNoSwiftPMMarker, () => {
  it(`does nothing when the iOS project has no marker`, () => {
    expect(() => assertNoSwiftPMMarker(projectRoot)).not.toThrow();
  });

  it(`throws when the iOS project uses Swift Package Manager`, () => {
    vol.writeFileSync(marker, '{}');

    expect(() => assertNoSwiftPMMarker(projectRoot)).toThrow(
      expect.objectContaining({
        name: 'CommandError',
        message:
          'The iOS project uses Swift Package Manager (ios/App.xcodeproj/.spm-injected.json exists), but experiments.swiftPackageManager is not enabled in the app config. To keep Swift Package Manager, add "experiments": { "swiftPackageManager": true } to the app config. To switch back to CocoaPods, run `npx expo prebuild --clean` to regenerate the iOS project.',
      })
    );
  });
});

describe(setupSwiftPMAsync, () => {
  it(`adds Swift Package Manager and deintegrates CocoaPods when there is no marker`, async () => {
    await setupSwiftPMAsync(projectRoot, { install: true });

    expectSpawnedScriptWith(addArgs);
  });

  it(`updates Swift Package Manager when the marker exists`, async () => {
    vol.writeFileSync(marker, '{}');

    await setupSwiftPMAsync(projectRoot, { install: true });

    expectSpawnedScriptWith(updateArgs);
  });

  it(`resolves React Native from the project`, async () => {
    await setupSwiftPMAsync(projectRoot, { install: true });

    expect(createRequire).toHaveBeenCalledWith(path.join(projectRoot, 'package.json'));
  });

  it(`throws when React Native does not ship the setup script`, async () => {
    vol.unlinkSync(localScript);

    const result = setupSwiftPMAsync(projectRoot, { install: true });
    await expect(result).rejects.toMatchObject({ name: 'CommandError' });
    await expect(result).rejects.toThrow(/React Native 0\.88 or later/);
    await expect(result).rejects.toThrow(/experiments\.swiftPackageManager/);
    await expect(result).rejects.not.toThrow(/--swiftpm/);
    expect(spawnAsync).not.toHaveBeenCalled();
  });

  it(`throws when React Native cannot be resolved`, async () => {
    mockReactNativeAt(null);

    await expect(setupSwiftPMAsync(projectRoot, { install: true })).rejects.toThrow(
      /React Native 0\.88 or later/
    );
    expect(spawnAsync).not.toHaveBeenCalled();
  });

  it(`throws with the output and the command to re-run when the script fails`, async () => {
    jest.mocked(spawnAsync).mockRejectedValueOnce(
      Object.assign(new Error('node exited with non-zero code: 1'), {
        status: 1,
        stderr: 'xcodeproj is broken',
      })
    );

    const result = setupSwiftPMAsync(projectRoot, { install: true });
    await expect(result).rejects.toMatchObject({ name: 'CommandError' });
    await expect(result).rejects.toThrow(/xcodeproj is broken/);
    await expect(result).rejects.toThrow(printedAddCommand);
  });

  it(`prints the command instead of running it with --no-install`, async () => {
    await setupSwiftPMAsync(projectRoot, { install: false });

    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).toContain(printedAddCommand);
  });

  it(`prints the update command with --no-install when the marker exists`, async () => {
    vol.writeFileSync(marker, '{}');

    await setupSwiftPMAsync(projectRoot, { install: false });

    expect(loggedOutput()).toContain(
      `${printedNodeScript} update --yes --config-command ${quotedConfigCommand}`
    );
  });

  it(`prints the command instead of running it outside macOS`, async () => {
    setPlatform('linux');

    await setupSwiftPMAsync(projectRoot, { install: true });

    expect(spawnAsync).not.toHaveBeenCalled();
    expect(loggedOutput()).toContain(`${printedNodeScript} add --deintegrate --yes`);
    expect(loggedOutput()).toMatch(/macOS/);
  });

  it(`prints a hoisted script relative to the project`, async () => {
    const hoisted = '/node_modules/react-native/scripts/setup-apple-spm.js';
    vol.unlinkSync(localScript);
    vol.mkdirSync(path.dirname(hoisted), { recursive: true });
    vol.writeFileSync(hoisted, '');
    mockReactNativeAt('/node_modules/react-native');

    await setupSwiftPMAsync(projectRoot, { install: false });

    expect(loggedOutput()).toContain(
      'node ../node_modules/react-native/scripts/setup-apple-spm.js add --deintegrate'
    );
  });
});
