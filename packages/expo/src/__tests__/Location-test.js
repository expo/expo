import { NativeModules } from 'react-native';

import { Permissions } from 'expo-permissions';
import {
  mockProperty,
  unmockAllProperties,
  mockPlatformIOS,
  mockPlatformAndroid,
} from '../../test/mocking';
import Location from '../Location';

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

let ExpoLocation;

function applyMocks() {
  mockProperty(
    NativeModules.ExponentLocation,
    'getCurrentPositionAsync',
    jest.fn(async () => fakeReturnValue)
  );
  ExpoLocation = NativeModules.ExponentLocation;
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
      let result = await Location.getCurrentPositionAsync({});
      expect(result).toEqual(fakeReturnValue);
    });

    it('works on iOS', async () => {
      mockPlatformIOS();

      // Asynchronously notify the watcher used to get the current position
      ExpoLocation.watchPositionImplAsync.mockImplementationOnce(async () => {
        setImmediate(() => emitNativeLocationUpdate(fakeReturnValue));
      });

      let result = await Location.getCurrentPositionAsync({});
      expect(result).toEqual(fakeReturnValue);
    });
  });

  describe('watchPositionAsync', () => {
    it('receives repeated events', async () => {
      let callback = jest.fn();
      let watchBarrier = createMockFunctionBarrier(ExpoLocation.watchPositionImplAsync);
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
      ExpoLocation.geocodeAsync.mockImplementationOnce(async () => {
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
    const noop = () => {};

    beforeEach(() => {
      applyMocks();
    });

    afterEach(() => {
      unmockAllProperties();
    });

    describe('getCurrentPosition', () => {
      it('asks for permissions beforehand', () => {
        let askAsyncMock = jest.fn();
        mockProperty(Permissions, 'askAsync', askAsyncMock);
        global.navigator.geolocation.getCurrentPosition(noop, noop, {});
        expect(askAsyncMock).toHaveBeenCalledWith(Permissions.LOCATION);
      });

      it('invokes error callback if permissions are rejected', async () => {
        let denyPermission = jest.fn(async () => ({ status: 'denied' }));
        mockProperty(Permissions, 'askAsync', denyPermission);

        let permissionBarrier = createMockFunctionBarrier(Permissions.askAsync);
        let errorCallback = jest.fn();
        navigator.geolocation.getCurrentPosition(noop, errorCallback, {});
        await permissionBarrier;
        expect(errorCallback).toHaveBeenCalled();
      });

      it('delegates to getCurrentPositionAsync when permissions are granted', async () => {
        mockProperty(Permissions, 'askAsync', async () => ({
          status: 'granted',
        }));

        mockProperty(Location, 'getCurrentPositionAsync', jest.fn(async () => {}));

        let pass;
        let barrier = new Promise(resolve => {
          pass = resolve;
        });

        let options = {};
        navigator.geolocation.getCurrentPosition(pass, pass, options);
        await barrier;
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith(options);
      });
    });

    describe('watchPosition', () => {
      it('asks for permissions beforehand', () => {
        let grantPermission = jest.fn(async () => ({ status: 'granted' }));
        mockProperty(Permissions, 'askAsync', grantPermission);
        navigator.geolocation.watchPosition(noop, noop);
        expect(grantPermission).toHaveBeenCalledWith(Permissions.LOCATION);
      });

      it('invokes error callback if permissions are rejected', async () => {
        let denyPermission = jest.fn(async () => ({ status: 'denied' }));
        mockProperty(Permissions, 'askAsync', denyPermission);

        let permissionBarrier = createMockFunctionBarrier(Permissions.askAsync);
        let errorCallback = jest.fn();
        navigator.geolocation.watchPosition(noop, errorCallback);
        await permissionBarrier;
        expect(errorCallback).toHaveBeenCalled();
      });

      it('watches for updates and stops when clearWatch is called', async () => {
        mockProperty(Permissions, 'askAsync', async () => ({
          status: 'granted',
        }));

        let watchBarrier = createMockFunctionBarrier(ExpoLocation.watchPositionImplAsync);

        let callback = jest.fn();
        let watchId = navigator.geolocation.watchPosition(callback);
        await watchBarrier;
        emitNativeLocationUpdate(fakeReturnValue);
        emitNativeLocationUpdate(fakeReturnValue);
        expect(callback).toHaveBeenCalledTimes(2);

        navigator.geolocation.clearWatch(watchId);
        emitNativeLocationUpdate(fakeReturnValue);
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    describe('stopObserving', () => {
      it('does nothing!', () => {
        // but should it do something?
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

function createMockFunctionBarrier(mockFn) {
  return new Promise(resolve => {
    mockFn.mockImplementationOnce(() => {
      setImmediate(resolve);
      return mockFn();
    });
  });
}
