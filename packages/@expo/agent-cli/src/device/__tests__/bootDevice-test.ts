// @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment
// The two choices this module makes before it touches anything: which simulator to boot, and which
// AVD to start. Both are pure functions of a tool's output, and both can be wrong in a way that
// costs a minute of a real run and then fails against the device it picked — so they are pinned
// here, with no Xcode and no Android SDK involved.

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
    expect(resolveEmulator(adb, { exists: () => true })).toBe(
      '/Users/dev/Library/Android/sdk/emulator/emulator'
    );
  });

  it(`falls back to the bare name, so PATH can still supply one`, () => {
    expect(resolveEmulator(adb, { exists: () => false })).toBe('emulator');
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
