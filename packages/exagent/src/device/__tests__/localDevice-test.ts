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

describe(readLocalDeviceProbe, () => {
  it(`reports the device when one platform found one`, () => {
    expect(readLocalDeviceProbe([found, none])).toEqual({
      state: 'present',
      device: found.device,
      reason: null,
    });
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
