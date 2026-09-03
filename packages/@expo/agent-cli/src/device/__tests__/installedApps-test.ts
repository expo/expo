// @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
// Which apps a simulator has, read off disk.
//
// The reason this module is a filesystem reader rather than a `simctl` call is measured, and it is
// the whole design: `simctl listapps` and `simctl get_app_container` both answer
// `Unable to lookup in current state: Shutdown` [observed — 2026-08-30, Xcode 26]. Every device
// worth asking about is shut — that is why the run is about to boot one — so the only question the
// tools can answer is the one nobody needs.

import { vol } from 'memfs';
import path from 'path';

import {
  appBundleDirs,
  readInstalledAppIdsAsync,
  simulatorDeviceDir,
  simulatorDiskExistsAsync,
} from '../installedApps';

describe(simulatorDeviceDir, () => {
  it(`points at the device's own directory under CoreSimulator`, () => {
    expect(simulatorDeviceDir('ABC-123', { homedir: '/Users/dev' })).toBe(
      path.join('/Users/dev', 'Library', 'Developer', 'CoreSimulator', 'Devices', 'ABC-123')
    );
  });
});

describe(appBundleDirs, () => {
  // One installed app is one `<uuid>/Name.app` under `Bundle/Application`, and the uuid is the
  // container's rather than the app's — so the directory names say nothing and every one has to be
  // looked into.
  it(`lists the .app bundle of every installed app`, () => {
    const listed = appBundleDirs('/dev/ABC', {
      readdir: (dir) => {
        if (dir.endsWith(path.join('Bundle', 'Application'))) {
          return ['40DA8569', '991142D5', '.DS_Store'];
        }
        if (dir.endsWith('40DA8569')) {
          return ['dcapp.app'];
        }
        if (dir.endsWith('991142D5')) {
          return ['ExpoGo.app'];
        }
        // What the real filesystem does for the stray file in that directory, and the reason the
        // reader has to survive a listing that is not a container at all.
        throw Object.assign(new Error('ENOTDIR'), { code: 'ENOTDIR' });
      },
    });

    expect(listed).toEqual([
      path.join('/dev/ABC', 'data', 'Containers', 'Bundle', 'Application', '40DA8569', 'dcapp.app'),
      path.join(
        '/dev/ABC',
        'data',
        'Containers',
        'Bundle',
        'Application',
        '991142D5',
        'ExpoGo.app'
      ),
    ]);
  });

  // A device that has never been booted has no `data` directory at all, which is a fact about the
  // device rather than an error: it has no apps.
  it(`answers nothing for a device with no containers yet`, () => {
    expect(
      appBundleDirs('/dev/FRESH', {
        readdir: () => {
          throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        },
      })
    ).toEqual([]);
  });
});

describe(readInstalledAppIdsAsync, () => {
  it(`reads the bundle identifier of every installed app`, async () => {
    const ids = await readInstalledAppIdsAsync('ABC', {
      homedir: '/Users/dev',
      bundleDirs: () => ['/a/dcapp.app', '/a/ExpoGo.app'],
      readBundleIdAsync: async (dir) =>
        dir.includes('ExpoGo') ? 'host.exp.Exponent' : 'com.example.app',
    });

    expect(ids).toEqual(['com.example.app', 'host.exp.Exponent']);
  });

  // A bundle whose `Info.plist` will not read is one app this cannot place, and never a reason to
  // report that the device has none: the other bundles are still evidence.
  it(`skips a bundle it cannot read, and keeps the rest`, async () => {
    const ids = await readInstalledAppIdsAsync('ABC', {
      homedir: '/Users/dev',
      bundleDirs: () => ['/a/broken.app', '/a/ExpoGo.app'],
      readBundleIdAsync: async (dir) => (dir.includes('broken') ? null : 'host.exp.Exponent'),
    });

    expect(ids).toEqual(['host.exp.Exponent']);
  });

  it(`answers nothing for a device with no bundles`, async () => {
    expect(
      await readInstalledAppIdsAsync('FRESH', { homedir: '/Users/dev', bundleDirs: () => [] })
    ).toEqual([]);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
//
// "No apps" and "could not look" are the same answer from `readInstalledAppIdsAsync`, and for the
// boot choice that is deliberate: both mean do not boot this device. For the **install** decision
// they are opposite, because one of them means spend 423 MB — so a caller that acts needs to know
// whether the disk was there to read.
//
// Found by CI: the agent-cli e2e tier runs on Linux, where there is no CoreSimulator tree and no
// `plutil`, so every fake udid read as "Expo Go is not installed" and the install phase reached for
// a real download [observed — tier0-linux, 2026-09-03].
describe(simulatorDiskExistsAsync, () => {
  // The virtual filesystem is shared by every test in the process, so each case starts from empty
  // — otherwise the first one's device directory answers for the second one's udid.
  beforeEach(() => {
    vol.reset();
  });

  it(`is true for a device whose directory is there`, async () => {
    vol.fromJSON({ '/home/Library/Developer/CoreSimulator/Devices/UDID/.keep': '' });

    expect(await simulatorDiskExistsAsync('UDID', { homedir: '/home' })).toBe(true);
  });

  it(`is false for a udid nothing on this machine has`, async () => {
    vol.fromJSON({ '/home/Library/Developer/CoreSimulator/Devices/OTHER/.keep': '' });

    expect(await simulatorDiskExistsAsync('UDID', { homedir: '/home' })).toBe(false);
  });

  // The Linux case, and the whole point: no CoreSimulator tree at all.
  it(`is false on a machine with no simulator tree`, async () => {
    vol.fromJSON({ '/home/.keep': '' });

    expect(await simulatorDiskExistsAsync('UDID', { homedir: '/home' })).toBe(false);
  });
});
