// @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
//
// The three answers matter more than the probe: `absent` is what turns `navigate` off, and it may
// only be given by a tool that ran and reported nothing. A tool that could not run at all is
// silence, and silence has to read as `unknown` — a machine with no `adb` is not a machine with no
// device.

import type { DeviceProbe } from '../../navigate/device';
import { CommandError } from '../../utils/errors';
import { probeLocalDeviceAsync, readLocalDeviceProbe, resetLocalDeviceCache } from '../localDevice';

/** A probe that ran and found something. */
const found: DeviceProbe = {
  device: { backend: 'local-ios', platform: 'ios', deviceId: 'UDID-1', name: 'iPhone 17' },
};

/** A probe that ran and found nothing. */
const none: DeviceProbe = {
  device: null,
  reason: 'no booted iOS simulator was found',
};

/**
 * A probe whose tool is not installed, which establishes nothing about the machine.
 *
 * `toolError` is the device probe's own signal for it, and the same one the failure message uses
 * to avoid reporting a missing SDK as a missing device (`src/device/adb.ts`, friction run 6's F49).
 */
const unrunnable: DeviceProbe = {
  device: null,
  reason: 'could not run "adb": spawn adb ENOENT',
  toolError: new CommandError('ADB_NOT_RUNNABLE', 'adb could not be run'),
};

/** An attached Android emulator, as the second probe reports it. */
const foundAndroid: DeviceProbe = {
  device: {
    backend: 'local-android',
    platform: 'android',
    deviceId: 'emulator-5554',
    name: 'sdk_gphone64_arm64',
  },
};

describe(readLocalDeviceProbe, () => {
  it(`reports the device when one platform found one`, () => {
    expect(readLocalDeviceProbe([found, none])).toEqual({
      state: 'present',
      device: found.device,
      devices: [found.device],
      reason: null,
    });
  });

  // F106 — MED, found live on 2026-08-27. This fold took `probes.find((probe) => probe.device)` and
  // iOS is probed first on macOS, so with a booted simulator *and* an attached emulator the report
  // named the simulator and said nothing about the emulator at all. Live: `status` printed
  // `device  ios iPhone 17 Pro (C159CF99-…)` while the only app on the dev server was Expo Go on
  // `emulator-5554`, which is the reading an agent takes as "the app is on iOS".
  //
  // The singular `device` is unchanged — first found, which is what every ladder already branches on
  // — and `devices` is what makes the report true rather than merely not-wrong.
  it(`reports every device that was found, not only the first (F106)`, () => {
    const probe = readLocalDeviceProbe([found, foundAndroid]);

    expect(probe.state).toBe('present');
    expect(probe.device).toEqual(found.device);
    expect(probe.devices).toEqual([found.device, foundAndroid.device]);
  });

  it(`reports an empty device list when nothing was found (F106)`, () => {
    expect(readLocalDeviceProbe([none, unrunnable]).devices).toEqual([]);
    expect(readLocalDeviceProbe([]).devices).toEqual([]);
  });

  it(`reports absent when a tool ran and reported nothing`, () => {
    const probe = readLocalDeviceProbe([none, unrunnable]);

    expect(probe.state).toBe('absent');
    expect(probe.device).toBeNull();
    expect(probe.reason).toContain('no booted iOS simulator was found');
  });

  it(`reports unknown when no tool could run at all`, () => {
    const probe = readLocalDeviceProbe([unrunnable, unrunnable]);

    expect(probe.state).toBe('unknown');
    expect(probe.reason).toContain('could not run');
  });

  it(`reports unknown for a host that was asked nothing`, () => {
    expect(readLocalDeviceProbe([]).state).toBe('unknown');
  });
});

describe(probeLocalDeviceAsync, () => {
  beforeEach(() => resetLocalDeviceCache());
  afterEach(() => resetLocalDeviceCache());

  it(`asks the platform tools once, however many callers ask`, async () => {
    const probes = jest.fn(async () => [none]);

    const [first, second] = await Promise.all([
      probeLocalDeviceAsync({ probesAsync: probes }),
      probeLocalDeviceAsync({ probesAsync: probes }),
    ]);

    expect(probes).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.state).toBe('absent');
  });

  // A probe is a convenience: a suggestion ladder must never be the thing that fails a command.
  it(`answers unknown when the probe itself throws`, async () => {
    const probe = await probeLocalDeviceAsync({
      probesAsync: async () => {
        throw new Error('simctl exploded');
      },
    });

    expect(probe.state).toBe('unknown');
    expect(probe.reason).toContain('simctl exploded');
  });
});
