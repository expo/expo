// @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
// The two choices this module makes before it touches anything: which simulator to boot, and which
// AVD to start. Both are pure functions of a tool's output, and both can be wrong in a way that
// costs a minute of a real run and then fails against the device it picked — so they are pinned
// here, with no Xcode and no Android SDK involved.

import path from 'path';

import {
  EMULATOR_SERIAL,
  parseAvds,
  parseSimulators,
  pickSimulator,
  resolveEmulator,
  type SimulatorEntry,
} from '../bootDevice';

/** A `simctl list devices -j` payload, in the shape the real tool prints. */
function listing(devices: Record<string, unknown[]>): string {
  return JSON.stringify({ devices });
}

function simulator(overrides: Partial<SimulatorEntry> = {}): SimulatorEntry {
  return {
    udid: 'SIM-1',
    name: 'iPhone 17 Pro',
    runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5',
    version: [26, 5],
    state: 'Shutdown',
    isAvailable: true,
    lastBootedAt: 0,
    ...overrides,
  };
}

describe(parseSimulators, () => {
  it(`reads the devices of every iOS runtime`, () => {
    const parsed = parseSimulators(
      listing({
        'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
          { udid: 'A', name: 'iPhone 17 Pro', state: 'Shutdown' },
        ],
        'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
          { udid: 'B', name: 'iPhone 15', state: 'Booted' },
        ],
      })
    );

    expect(parsed).toEqual([
      expect.objectContaining({ udid: 'A', version: [26, 5], isAvailable: true }),
      expect.objectContaining({ udid: 'B', version: [18, 0], state: 'Booted' }),
    ]);
  });

  // A device that has never been booted has no apps on it, and `simctl` says so by omitting the
  // key rather than by any value — so the absence has to read as "never", not as "unknown".
  it(`reads lastBootedAt, and zero for a device that has never been booted`, () => {
    const parsed = parseSimulators(
      listing({
        'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
          { udid: 'A', name: 'iPhone 17 Pro', lastBootedAt: '2026-08-26T04:50:48Z' },
          { udid: 'B', name: 'iPhone Air' },
        ],
      })
    );

    expect(parsed.map((entry) => entry.lastBootedAt)).toEqual([
      Date.parse('2026-08-26T04:50:48Z'),
      0,
    ]);
  });

  // A booted watchOS simulator cannot run this project's app, and a minute spent booting one is a
  // minute followed by a failure in every phase after it.
  it(`reads no runtime that is not iOS`, () => {
    expect(
      parseSimulators(
        listing({
          'com.apple.CoreSimulator.SimRuntime.watchOS-11-0': [{ udid: 'W', name: 'Apple Watch' }],
          'com.apple.CoreSimulator.SimRuntime.tvOS-18-0': [{ udid: 'T', name: 'Apple TV' }],
        })
      )
    ).toEqual([]);
  });

  // `simctl` omits `isAvailable` for the ordinary case and sets it false for a device whose runtime
  // has been removed. Reading the absence as "unavailable" would find no simulator on a healthy Mac.
  it(`treats a missing isAvailable as available, and false as not`, () => {
    const parsed = parseSimulators(
      listing({
        'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
          { udid: 'A', name: 'iPhone 17 Pro' },
          { udid: 'B', name: 'iPhone 15', isAvailable: false },
        ],
      })
    );

    expect(parsed.map((entry) => entry.isAvailable)).toEqual([true, false]);
  });

  it(`answers nothing for output that is not the JSON this asked for`, () => {
    expect(parseSimulators('xcrun: error: unable to find utility "simctl"')).toEqual([]);
    expect(parseSimulators('')).toEqual([]);
  });
});

describe(pickSimulator, () => {
  // The rule, and it is about **installed apps** rather than about recency. Expo Go and a
  // development build both live on one device, so a simulator nobody has booted is a device the
  // `app` phase could never have answered against — and this machine lists ten of them beside the
  // one in use.
  it(`takes the simulator this developer last used, over a newer one nobody has`, () => {
    const picked = pickSimulator([
      simulator({ udid: 'FRESH', name: 'iPhone 17 Pro Max', version: [26, 5], lastBootedAt: 0 }),
      simulator({
        udid: 'IN-USE',
        name: 'iPhone 17 Pro',
        version: [26, 5],
        lastBootedAt: Date.parse('2026-08-26T04:50:48Z'),
      }),
    ]);

    expect(picked?.udid).toBe('IN-USE');
  });

  it(`takes an iPhone on the newest runtime`, () => {
    const picked = pickSimulator([
      simulator({ udid: 'OLD-PHONE', name: 'iPhone 15', version: [18, 0] }),
      simulator({ udid: 'NEW-PAD', name: 'iPad Pro 13-inch', version: [26, 5] }),
      simulator({ udid: 'NEW-PHONE', name: 'iPhone 17 Pro', version: [26, 5] }),
    ]);

    expect(picked?.udid).toBe('NEW-PHONE');
  });

  // A run on some device is worth much more than a run on none, so an iPad is taken when that is
  // all this machine has.
  it(`takes whatever there is when there is no iPhone`, () => {
    expect(pickSimulator([simulator({ udid: 'PAD', name: 'iPad Pro 13-inch' })])?.udid).toBe('PAD');
  });

  // The caller only reaches this after its own probe found nothing booted, so a `Booted` device
  // here is a race — and joining it is both faster and less disruptive than booting a second one.
  it(`joins a simulator that is already booted, whatever its runtime`, () => {
    const picked = pickSimulator([
      simulator({ udid: 'NEW', name: 'iPhone 17 Pro', version: [26, 5] }),
      simulator({ udid: 'UP', name: 'iPhone 15', version: [18, 0], state: 'Booted' }),
    ]);

    expect(picked?.udid).toBe('UP');
  });

  it(`takes no device whose runtime is gone, and none at all when there is none`, () => {
    expect(pickSimulator([simulator({ isAvailable: false })])).toBeNull();
    expect(pickSimulator([])).toBeNull();
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app.
//
// The rule above chose the simulator most recently used, which is a *proxy* for "the one with the
// apps on it". A live run found where the proxy breaks: a dev-client project booted a fresh
// simulator and the deep link came back `115` — no handler — after a 12.4 s boot for a device that
// could never have opened it. So the app itself is the rule now, and `lastBootedAt` is what breaks
// the tie among the devices that have it.
describe(`${pickSimulator.name} when the app decides`, () => {
  const fresh = simulator({ udid: 'FRESH', name: 'iPhone 17', lastBootedAt: 0 });
  const used = simulator({
    udid: 'USED',
    name: 'iPhone 17 Pro',
    lastBootedAt: Date.parse('2026-08-30T08:00:00Z'),
  });
  const older = simulator({
    udid: 'OLDER',
    name: 'iPhone Air',
    lastBootedAt: Date.parse('2026-08-20T08:00:00Z'),
  });

  it(`takes the device that has the app over the one used more recently`, () => {
    const picked = pickSimulator([fresh, used, older], {
      hasApp: (entry) => entry.udid === 'OLDER',
    });

    expect(picked?.udid).toBe('OLDER');
  });

  it(`breaks a tie between devices that have it the way it always did`, () => {
    const picked = pickSimulator([fresh, used, older], {
      hasApp: (entry) => entry.udid !== 'FRESH',
    });

    expect(picked?.udid).toBe('USED');
  });

  // The whole point: a boot that could not have opened the app is worse than no boot, because it
  // costs the minute *and* answers nothing.
  it(`takes nothing when no device has the app`, () => {
    expect(pickSimulator([fresh, used, older], { hasApp: () => false })).toBeNull();
  });

  // A booted device still wins outright, and still without asking about the app: the caller only
  // reaches this when its own probe found none, so one here is a race worth joining.
  it(`still joins a simulator that is already booted`, () => {
    const up = simulator({ udid: 'UP', state: 'Booted', lastBootedAt: 0 });

    expect(pickSimulator([used, up], { hasApp: (entry) => entry.udid === 'USED' })?.udid).toBe(
      'UP'
    );
  });

  // No question asked is not the same as answered no. A caller that does not know which app it is
  // about gets the rule that was there before this one.
  it(`falls back to the most recently used when nothing asks about an app`, () => {
    expect(pickSimulator([fresh, used, older])?.udid).toBe('USED');
  });
});

describe(parseAvds, () => {
  it(`reads one name per line`, () => {
    expect(parseAvds('Pixel_7_API_35\ntuft-pixel\n')).toEqual(['Pixel_7_API_35', 'tuft-pixel']);
  });

  // Some SDK versions print their own advice to stdout beside the names. Every line of it has a
  // space in it and no AVD name does, which is what tells them apart without a version check.
  it(`reads none of the advice the tool prints beside them`, () => {
    expect(
      parseAvds(
        [
          'INFO    | Storing crashdata in: /tmp/foo',
          'tuft-pixel',
          '',
          'The following AVDs have an unknown device type:',
        ].join('\n')
      )
    ).toEqual(['tuft-pixel']);
  });
});

// The copy belonging to the SDK the rest of this CLI uses. Two Android SDKs on one machine is
// common, and an AVD created in one is not listed by the other — so a bare `emulator` from `PATH`
// would report "no virtual device" on a machine with one.
describe(resolveEmulator, () => {
  const adb = {
    bin: '/Users/dev/Library/Android/sdk/platform-tools/adb',
    source: 'ANDROID_HOME' as const,
    searched: [],
    fromPathOnly: false,
  };

  it(`takes the emulator beside the resolved adb when the SDK has one`, () => {
    const executable = process.platform === 'win32' ? 'emulator.exe' : 'emulator';
    expect(resolveEmulator(adb, { exists: () => true })).toBe(
      path.join('/Users/dev/Library/Android/sdk', 'emulator', executable)
    );
  });

  it(`falls back to the bare name, so PATH can still supply one`, () => {
    expect(resolveEmulator(adb, { exists: () => false })).toBe(
      process.platform === 'win32' ? 'emulator.exe' : 'emulator'
    );
  });
});

// @ref src/device/bootDevice.ts — friction run 6, F62. An emulator started without
// `-ports 5554,5555` binds ephemeral ports and `adb devices` never lists it *at all*. The serial
// is therefore knowable before the boot, which is the only reason the cleanup can be registered
// before the device is touched.
describe('the serial an emulator this CLI starts is always on', () => {
  it(`is the one the -ports argument pins`, () => {
    expect(EMULATOR_SERIAL).toBe('emulator-5554');
  });
});
