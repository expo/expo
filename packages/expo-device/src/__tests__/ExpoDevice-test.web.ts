import { Platform } from 'expo-modules-core';

import ExpoDevice from '../ExpoDevice.web';

beforeEach(() => {
  if (Platform.isDOMAvailable && navigator) {
    // @ts-ignore
    delete navigator.deviceMemory;
  }
});

if (Platform.isDOMAvailable) {
  it(`returns totalMemory as bytes`, () => {
    Object.defineProperties(navigator, {
      deviceMemory: {
        enumerable: true,
        get() {
          return 8;
        },
      },
    });
    expect(ExpoDevice.totalMemory).toBe(8589934592);
  });
} else {
  it(`returns null for totalMemory`, () => {
    expect(ExpoDevice.totalMemory).toBe(null);
  });
}
