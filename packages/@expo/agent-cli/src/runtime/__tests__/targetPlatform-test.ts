import type { CdpTarget } from '../cdpClient';
import {
  bootedSimulatorNames,
  EMPTY_DEVICE_INDEX,
  platformOfTarget,
  platformsOfTargets,
  scopeTargets,
} from '../targetPlatform';

/**
 * The live payload of one dev server with an iOS simulator and an Android emulator both attached
 * [captured — 2026-08-25, notesapp on SDK 57, port 8250]. Kept as a file rather than as a literal
 * because everything this module decides is decided from these exact fields.
 */
const LIVE_TARGETS: CdpTarget[] = require('./fixtures/json-list-ios-and-android.json');

const iosTarget = LIVE_TARGETS.find((target) => target.appId === 'host.exp.Exponent')!;
const androidTarget = LIVE_TARGETS.find((target) => target.appId === 'host.exp.exponent')!;

describe(platformOfTarget, () => {
  it('reads the platform of both live targets with no device index at all', () => {
    // The point of the two index-free rules: a machine with no `adb` still tells them apart.
    expect(platformOfTarget(iosTarget).platform).toBe('ios');
    expect(platformOfTarget(androidTarget).platform).toBe('android');
  });

  it('names what decided it', () => {
    expect(platformOfTarget(androidTarget).evidence).toContain('sdk_gphone64_arm64 - 15 - API 35');
    expect(platformOfTarget(iosTarget).evidence).toContain('host.exp.Exponent');
  });

  it('prefers a booted simulator this machine just named', () => {
    const verdict = platformOfTarget(
      { appId: 'com.example.app', deviceName: 'iPhone 17 Pro' },
      { iosNames: ['iPhone 17 Pro'], androidModels: [] }
    );
    expect(verdict.platform).toBe('ios');
    expect(verdict.evidence).toContain('booted iOS simulator');
  });

  it('matches an attached Android device by its model, with or without the API suffix', () => {
    const index = { iosNames: [], androidModels: ['Pixel 7'] };
    expect(
      platformOfTarget({ appId: 'com.example.app', deviceName: 'Pixel 7' }, index).platform
    ).toBe('android');
    expect(
      platformOfTarget({ appId: 'com.example.app', deviceName: 'Pixel 7 - 15 - API 35' }, index)
        .platform
    ).toBe('android');
  });

  it('answers null rather than guessing for a development build it cannot place', () => {
    const verdict = platformOfTarget({ appId: 'com.example.app', deviceName: 'Ada’s phone' });
    expect(verdict.platform).toBeNull();
    expect(verdict.evidence).toContain('nothing in the target names a platform');
  });

  it('does not read the Expo Go ids case-insensitively, because the case is the whole difference', () => {
    expect(platformOfTarget({ appId: 'HOST.EXP.EXPONENT', deviceName: '' }).platform).toBeNull();
  });
});

describe(scopeTargets, () => {
  it('keeps an undetermined target out of the matched set', () => {
    const unknown = { appId: 'com.example.app', deviceName: 'Ada’s phone' } as CdpTarget;
    const scoped = scopeTargets([...LIVE_TARGETS, unknown], 'android', EMPTY_DEVICE_INDEX);

    expect(scoped.matched).toEqual([androidTarget]);
    expect(scoped.otherPlatform).toEqual([{ target: iosTarget, platform: 'ios' }]);
    expect(scoped.undetermined).toEqual([unknown]);
  });
});

describe(platformsOfTargets, () => {
  it('reports both platforms of a mixed dev server', () => {
    expect(platformsOfTargets(LIVE_TARGETS)).toEqual({
      platforms: ['ios', 'android'],
      undetermined: 0,
    });
  });

  it('counts the targets it could not place', () => {
    expect(
      platformsOfTargets([{ appId: 'com.example.app', deviceName: 'x' } as CdpTarget])
    ).toEqual({
      platforms: [],
      undetermined: 1,
    });
  });
});

describe(bootedSimulatorNames, () => {
  it('reads every booted runtime, so a watch simulator is not mistaken for something else', () => {
    const names = bootedSimulatorNames(
      JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [{ udid: 'A', name: 'iPhone 17 Pro' }],
          'com.apple.CoreSimulator.SimRuntime.watchOS-26-0': [{ udid: 'B', name: 'Apple Watch' }],
        },
      })
    );
    expect(names).toEqual(['iPhone 17 Pro', 'Apple Watch']);
  });

  it('answers nothing for output that is not JSON', () => {
    expect(bootedSimulatorNames('xcrun: error')).toEqual([]);
  });
});
