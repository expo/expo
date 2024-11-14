import { Platform } from 'expo-modules-core';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExpoLocation from '../ExpoLocation';
import * as Location from '../index';

const fakeReturnValue = {
  coords: {
    latitude: 1,
    longitude: 2,
    altitude: 3,
    accuracy: 4,
    heading: 5,
    speed: 6,
  },
  timestamp: 7,
};

function applyMocks() {
  mockProperty(
    ExpoLocation,
    'getCurrentPositionAsync',
    jest.fn(async () => fakeReturnValue)
  );
  mockProperty(
    ExpoLocation,
    'requestPermissionsAsync',
    jest.fn(async () => {})
  );
}

beforeAll(() => {
  Location.installWebGeolocationPolyfill();
});

beforeEach(() => {
  applyMocks();
});

afterEach(() => {
  unmockAllProperties();
});

it(`getCurrentPositionAsync works`, async () => {
  const result = await Location.getCurrentPositionAsync({});
  expect(result).toEqual(fakeReturnValue);
});

describe('watchPositionAsync', () => {
  it(`receives repeated events`, async () => {
    let resolveBarrier;
    const callback = jest.fn();
    const watchBarrier = new Promise((resolve) => {
      resolveBarrier = resolve;
    });
    mockProperty(ExpoLocation, 'watchPositionImplAsync', jest.fn(resolveBarrier));
    await Location.watchPositionAsync({}, callback);
    await watchBarrier;

    emitNativeLocationUpdate(fakeReturnValue);
    emitNativeLocationUpdate(fakeReturnValue);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

if (Platform.OS === 'android') {
  xdescribe('geocodeAsync', () => {
    // TODO(@tsapeta): This doesn't work due to missing Google Maps API key.
    it(`falls back to Google Maps API on Android without Google Play services`, () => {
      mockProperty(ExpoLocation, 'geocodeAsync', async () => {
        const error = new Error();
        (error as any).code = 'E_NO_GEOCODER';
        throw error;
      });
      return expect(Location.geocodeAsync('Googleplex')).rejects.toMatchObject({
        code: 'E_NO_GEOCODER',
      });
    });
  });
}

describe('reverseGeocodeAsync', () => {
  it(`rejects non-numeric latitude/longitude`, () => {
    // We need to cast these latitude/longitude strings to any type, so TypeScript diagnostics will pass here.
    return expect(
      Location.reverseGeocodeAsync({ latitude: '37.7' as any, longitude: '-122.5' as any })
    ).rejects.toEqual(expect.any(TypeError));
  });
});

describe('navigator.geolocation polyfill', () => {
  beforeEach(() => {
    applyMocks();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  describe('getCurrentPosition', () => {
    it(`delegates to getCurrentPositionAsync`, async () => {
      let pass;
      const barrier = new Promise((resolve) => {
        pass = resolve;
      });
      navigator.geolocation.getCurrentPosition(pass, pass, {});
      await barrier;
      expect(ExpoLocation.getCurrentPositionAsync).toHaveBeenCalled();
    });
  });

  describe('watchPosition', () => {
    it(`watches for updates and stops when clearWatch is called`, async () => {
      let resolveBarrier;
      const watchBarrier = new Promise((resolve) => {
        resolveBarrier = resolve;
      });
      mockProperty(
        ExpoLocation,
        'watchPositionImplAsync',
        jest.fn(async () => {
          resolveBarrier();
        })
      );
      const callback = jest.fn();

      const watchId = navigator.geolocation.watchPosition(callback);
      await watchBarrier;

      emitNativeLocationUpdate(fakeReturnValue);
      emitNativeLocationUpdate(fakeReturnValue);
      expect(callback).toHaveBeenCalledTimes(2);

      navigator.geolocation.clearWatch(watchId);
      emitNativeLocationUpdate(fakeReturnValue);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});

function emitNativeLocationUpdate(location) {
  Location.EventEmitter.emit('Expo.locationChanged', {
    watchId: Location._getCurrentWatchId(),
    location,
  });
}
