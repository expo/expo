import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import stripAnsi from 'strip-ansi';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import {
  CocoaPodsPackageManager,
  getPodRepoUpdateMessage,
  getPodUpdateMessage,
} from '../CocoaPodsPackageManager';

const projectRoot = getTemporaryPath();

function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}
function getRoot(...args) {
  return path.join(projectRoot, ...args);
}

jest.mock('@expo/spawn-async');

const originalForceColor = process.env.FORCE_COLOR;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Need to reset the modules, since FORCE_COLOR is cached inside `supports-color`
  jest.resetModules();
  process.env.FORCE_COLOR = '1';
  // Hide lots of warn statements from the output
  console.warn = jest.fn();
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  console.warn = originalConsoleWarn;
});

const fakePodRepoUpdateErrorOutput = {
  pid: 74312,
  // prettier-ignore
  output: [
    'Using Expo modules' + os.EOL +
      'Auto-linking React Native modules for target `yolo74`: RNGestureHandler, RNReanimated, RNScreens, and react-native-safe-area-context' + os.EOL +
      'Analyzing dependencies' + os.EOL +
      '[!] CocoaPods could not find compatible versions for pod "EXFileSystem":' + os.EOL +
      '  In snapshot (Podfile.lock):' + os.EOL +
      '    EXFileSystem (from `../node_modules/expo-file-system/ios`)' + os.EOL +
      '' + os.EOL +
      '  In Podfile:' + os.EOL +
      '    EXFileSystem (from `../node_modules/expo-file-system/ios`)' + os.EOL +
      '' + os.EOL +
      '' + os.EOL +
      'You have either:' + os.EOL +
      ' * out-of-date source repos which you can update with `pod repo update` or with `pod install --repo-update`.' + os.EOL +
      ' * changed the constraints of dependency `EXFileSystem` inside your development pod `EXFileSystem`.' + os.EOL +
      "   You should run `pod update EXFileSystem` to apply changes you've made.\n",
    'Ignoring ffi-1.13.1 because its extensions are not built. Try: gem pristine ffi --version 1.13.1\n',
  ],
  // prettier-ignore
  stdout:
    'Using Expo modules' + os.EOL +
    'Auto-linking React Native modules for target `yolo74`: RNGestureHandler, RNReanimated, RNScreens, and react-native-safe-area-context' + os.EOL +
    'Analyzing dependencies' + os.EOL +
    '[!] CocoaPods could not find compatible versions for pod "EXFileSystem":' + os.EOL +
    '  In snapshot (Podfile.lock):' + os.EOL +
    '    EXFileSystem (from `../node_modules/expo-file-system/ios`)' + os.EOL +
    '' + os.EOL +
    '  In Podfile:' + os.EOL +
    '    EXFileSystem (from `../node_modules/expo-file-system/ios`)' + os.EOL +
    '' + os.EOL +
    '' + os.EOL +
    'You have either:' + os.EOL +
    ' * out-of-date source repos which you can update with `pod repo update` or with `pod install --repo-update`.' + os.EOL +
    ' * changed the constraints of dependency `EXFileSystem` inside your development pod `EXFileSystem`.' + os.EOL +
    "   You should run `pod update EXFileSystem` to apply changes you've made.\n",
  // prettier-ignore
  stderr:
    'Ignoring ffi-1.13.1 because its extensions are not built. Try: gem pristine ffi --version 1.13.1' + os.EOL +
    'Ignoring digest-crc-0.6.1 because its extensions are not built. Try: gem pristine digest-crc --version 0.6.1' + os.EOL +
    'Ignoring ffi-1.13.1 because its extensions are not built. Try: gem pristine ffi --version 1.13.1' + os.EOL +
    'Ignoring unf_ext-0.0.7.7 because its extensions are not built. Try: gem pristine unf_ext --version 0.0.7.7\n',
  status: 1,
  signal: null,
};

describe(getPodUpdateMessage, () => {
  it(`matches pod update`, () => {
    expect(getPodUpdateMessage(fakePodRepoUpdateErrorOutput.stdout)).toStrictEqual({
      shouldUpdateRepo: true,
      updatePackage: 'EXFileSystem',
    });
  });
  it(`matches pod update without repo update`, () => {
    expect(
      getPodUpdateMessage(
        "It seems like you've changed the version of the dependency `React-Core/RCTWebSocket` and it differs from the version stored in `Pods/Local Podspecs`.\n" +
          'You should run `pod update React-Core/RCTWebSocket --no-repo-update` to apply changes made locally.\n'
      )
    ).toStrictEqual({
      shouldUpdateRepo: false,
      updatePackage: 'React-Core/RCTWebSocket',
    });
  });
});

describe(getPodRepoUpdateMessage, () => {
  it(`formats pod repo update message`, () => {
    expect(
      stripAnsi(
        getPodRepoUpdateMessage(
          '[!] Unable to find a specification for `expo-dev-menu-interface` depended upon by `expo-dev-launcher`'
        ).message
      )
    ).toBe(
      `Couldn't install: expo-dev-launcher » expo-dev-menu-interface. Updating the Pods project and trying again...`
    );
  });
  it(`formats pod update message`, () => {
    expect(
      stripAnsi(
        getPodRepoUpdateMessage(
          "You should run `pod update EXFileSystem` to apply changes you've made."
        ).message
      )
    ).toBe(`Couldn't install: EXFileSystem. Updating the Pods project and trying again...`);
  });
});

describe('installAsync', () => {
  it(`does pod repo update automatically when the Podfile.lock is malformed`, async () => {
    // Reload the Cocoapods package manager to ensure colors are enabled
    const { CocoaPodsPackageManager: ReloadedManager } = require('../CocoaPodsPackageManager');
    const manager = new ReloadedManager({ cwd: projectRoot });

    manager._runAsync = jest.fn((commands: string[]) => {
      const cmd = commands.join(' ');
      if (['install', 'update EXFileSystem', 'install --repo-update'].includes(cmd)) {
        throw fakePodRepoUpdateErrorOutput;
      }
      // eslint-disable-next-line no-throw-literal
      throw 'unhandled ig';
    });

    await expect(manager.installAsync()).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Command \`pod install --repo-update\` failed.
      └─ Cause: This is often due to native package versions mismatching. Try deleting the 'ios/Pods' folder or the 'ios/Podfile.lock' file and running 'npx pod-install' to resolve.

      [90m[!] CocoaPods could not find compatible versions for pod "EXFileSystem":[39m
      [90m  In snapshot (Podfile.lock):[39m
      [90m    EXFileSystem (from \`../node_modules/expo-file-system/ios\`)[39m
      [90m[39m
      [90m  In Podfile:[39m
      [90m    EXFileSystem (from \`../node_modules/expo-file-system/ios\`)[39m
      [90m[39m
      [90m[39m
      [90mYou have either:[39m
      [90m * out-of-date source repos which you can update with \`pod repo update\` or with \`pod install --repo-update\`.[39m
      [90m * changed the constraints of dependency \`EXFileSystem\` inside your development pod \`EXFileSystem\`.[39m
      [90m   You should run \`pod update EXFileSystem\` to apply changes you've made.[39m
      [90m[39m"
    `);

    // `pod install` > `pod update EXFileSystem` > `pod repo update` > `pod install`
    expect(manager._runAsync).toHaveBeenNthCalledWith(1, ['install']);
    expect(manager._runAsync).toHaveBeenNthCalledWith(2, ['update', 'EXFileSystem']);
    expect(manager._runAsync).toHaveBeenNthCalledWith(3, ['install', '--repo-update']);
    expect(manager._runAsync).toBeCalledTimes(3);
  });

  it(`auto updates malformed package versions`, async () => {
    const manager = new CocoaPodsPackageManager({ cwd: projectRoot });

    let invokedOnce = false;
    manager._runAsync = jest.fn((commands: string[]) => {
      const cmd = commands.join(' ');
      if (cmd === 'install') {
        // On the second invocation, return a successful result.
        if (invokedOnce) {
          return {};
        }
        invokedOnce = true;
        throw fakePodRepoUpdateErrorOutput;
      }
      if (cmd === 'update EXFileSystem') {
        return {};
      }
      if (cmd === 'repo update') {
        return {};
      }
      // eslint-disable-next-line no-throw-literal
      throw 'unhandled ig';
    });

    // Ensure an error is not thrown
    await manager.installAsync();

    // `pod install` > `pod update EXFileSystem` > `pod install`
    expect(manager._runAsync).toHaveBeenNthCalledWith(1, ['install']);
    expect(manager._runAsync).toHaveBeenNthCalledWith(2, ['update', 'EXFileSystem']);
    expect(manager._runAsync).toBeCalledTimes(2);
  });

  it(`runs install as expected`, async () => {
    const manager = new CocoaPodsPackageManager({ cwd: projectRoot });

    manager._runAsync = jest.fn((commands: string[]) => {
      const cmd = commands.join(' ');
      if (cmd === 'install') {
        return {};
      }
      // eslint-disable-next-line no-throw-literal
      throw 'unhandled ig';
    });

    // Ensure an error is not thrown
    await manager.installAsync();

    // `pod install` > success
    expect(manager._runAsync).toHaveBeenNthCalledWith(1, ['install']);
    expect(manager._runAsync).toBeCalledTimes(1);
  });
});

it(`throws for unimplemented methods`, async () => {
  const manager = new CocoaPodsPackageManager({ cwd: projectRoot });

  expect(() => manager.addAsync()).toThrow('Unimplemented');
  expect(() => manager.addDevAsync()).toThrow('Unimplemented');
  expect(() => manager.addGlobalAsync()).toThrow('Unimplemented');
  expect(() => manager.removeAsync([])).toThrow('Unimplemented');
  expect(() => manager.removeDevAsync([])).toThrow('Unimplemented');
  expect(() => manager.removeGlobalAsync([])).toThrow('Unimplemented');
  await expect(manager.configAsync('')).rejects.toThrow('Unimplemented');
  await expect(manager.removeLockfileAsync()).rejects.toThrow('Unimplemented');
  await expect(manager.uninstallAsync()).rejects.toThrow('Unimplemented');
});

it(`gets the cocoapods version`, async () => {
  const manager = new CocoaPodsPackageManager({ cwd: projectRoot });

  jest
    .mocked(spawnAsync)
    .mockImplementation(() => mockSpawnPromise(Promise.resolve({ stdout: '1.9.1' })));

  expect(await manager.versionAsync()).toBe('1.9.1');
});

it(`can detect if the CLI is installed`, async () => {
  const manager = new CocoaPodsPackageManager({ cwd: projectRoot });

  jest
    .mocked(spawnAsync)
    .mockImplementation(() => mockSpawnPromise(Promise.resolve({ stdout: '1.9.1' })));

  expect(await manager.isCLIInstalledAsync()).toBe(true);
});

it(`can get the directory of a pods project`, async () => {
  const projectRoot = getRoot('cocoapods-detect-pods');
  const iosRoot = path.join(projectRoot, 'ios');
  await fs.ensureDir(iosRoot);

  // first test when no pod project exists
  expect(CocoaPodsPackageManager.getPodProjectRoot(projectRoot)).toBe(null);

  // next test the ios/ folder
  fs.writeFileSync(path.join(iosRoot, 'Podfile'), '...');

  expect(CocoaPodsPackageManager.getPodProjectRoot(projectRoot)).toBe(iosRoot);

  // finally test that the current directory has higher priority than the ios directory
  fs.writeFileSync(path.join(projectRoot, 'Podfile'), '...');
  expect(CocoaPodsPackageManager.getPodProjectRoot(projectRoot)).toBe(projectRoot);
});

describe('isAvailable', () => {
  let platform: string;
  let originalLog: any;
  beforeAll(() => {
    platform = process.platform;
    originalLog = console.log;
  });
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: platform,
    });
    console.log = originalLog;
  });
  it(`does not support non-darwin machines`, () => {
    // set the platform to something other than darwin
    Object.defineProperty(process, 'platform', {
      value: 'something-random',
    });
    console.log = jest.fn();
    expect(CocoaPodsPackageManager.isAvailable(projectRoot, false)).toBe(false);
    expect(console.log).toBeCalledTimes(1);
  });
  it(`does not support projects without Podfiles`, async () => {
    // ensure the platform is darwin
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
    // create a fake project without a Podfile
    const projectRoot = getRoot('cocoapods-detect-available');
    await fs.ensureDir(projectRoot);

    let message = '';
    console.log = jest.fn((msg) => (message = msg));

    expect(CocoaPodsPackageManager.isAvailable(projectRoot, false)).toBe(false);
    expect(console.log).toBeCalledTimes(1);
    expect(message).toMatch(/not supported in this project/);
  });
});
