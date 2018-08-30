import { Location } from 'expo-location';
import { NativeModulesProxy } from 'expo-core';

import {
  mockProperty,
  unmockAllProperties,
  mockPlatformIOS,
  mockPlatformAndroid,
} from '../../test/mocking';

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
    NativeModulesProxy.ExpoLocation,
    'getCurrentPositionAsync',
    jest.fn(async () => fakeReturnValue)
  );
  mockProperty(NativeModulesProxy.ExpoLocation, 'requestPermissionsAsync', jest.fn(async () => {}));
}

describe('Location', () => {
  beforeEach(() => {
    applyMocks();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  describe('getCurrentPositionAsync', () => {
    it('works on Android', async () => {
      mockPlatformAndroid();
      const result = await Location.getCurrentPositionAsync({});
      expect(result).toEqual(fakeReturnValue);
    });

    it('works on iOS', async () => {
      mockPlatformIOS();
      const result = await Location.getCurrentPositionAsync({});
      expect(result).toEqual(fakeReturnValue);
    });
  });

  describe('watchPositionAsync', () => {
    it('receives repeated events', async () => {
      let resolveBarrier;
      const callback = jest.fn();
      const watchBarrier = new Promise(resolve => {
        resolveBarrier = resolve;
      });
      mockProperty(
        NativeModulesProxy.ExpoLocation,
        'watchPositionImplAsync',
        jest.fn(resolveBarrier)
      );
      await Location.watchPositionAsync({}, callback);
      await watchBarrier;

      emitNativeLocationUpdate(fakeReturnValue);
      emitNativeLocationUpdate(fakeReturnValue);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('geocodeAsync', () => {
    it('falls back to Google Maps API on Android without Google Play services', () => {
      mockPlatformAndroid();
      mockProperty(NativeModulesProxy.ExpoLocation, 'geocodeAsync', async () => {
        const error = new Error();
        error.code = 'E_NO_GEOCODER';
        throw error;
      });
      return expect(Location.geocodeAsync('Googleplex')).rejects.toEqual(
        expect.objectContaining({
          message: expect.stringContaining('Please set a Google API Key'),
        })
      );
    });
  });

  describe('reverseGeocodeAsync', () => {
    it('rejects non-numeric latitude/longitude', () => {
      return expect(
        Location.reverseGeocodeAsync({ latitude: '37.7', longitude: '-122.5' })
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
      it('delegates to getCurrentPositionAsync', async () => {
        let pass;
        const barrier = new Promise(resolve => {
          pass = resolve;
        });
        const options = {};
        navigator.geolocation.getCurrentPosition(pass, pass, options);
        await barrier;
        expect(NativeModulesProxy.ExpoLocation.getCurrentPositionAsync).toHaveBeenCalledWith(
          options
        );
      });
    });

    describe('watchPosition', () => {
      it('watches for updates and stops when clearWatch is called', async () => {
        let resolveBarrier;
        const watchBarrier = new Promise(resolve => {
          resolveBarrier = resolve;
        });
        mockProperty(
          NativeModulesProxy.ExpoLocation,
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
});

function emitNativeLocationUpdate(location) {
  Location.EventEmitter.emit('Exponent.locationChanged', {
    watchId: Location._getCurrentWatchId(),
    location,
  });
}
