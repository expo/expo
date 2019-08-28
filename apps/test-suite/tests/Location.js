'use strict';

import { Platform } from 'react-native';

import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';
import * as TestUtils from '../TestUtils';

const BACKGROUND_LOCATION_TASK = 'background-location-updates';
const GEOFENCING_TASK = 'geofencing-task';

export const name = 'Location';

export function canRunAsync({ isAutomated }) {
  // Popup to request device's location which uses Google's location service
  return !isAutomated;
}

export async function test({
  beforeAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  jasmine,
  expect,
  ...t
}) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : describe;

  function testLocationShape(location) {
    expect(typeof location === 'object').toBe(true);

    const { coords, timestamp } = location;
    const { latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed } = coords;

    expect(typeof latitude === 'number').toBe(true);
    expect(typeof longitude === 'number').toBe(true);
    expect(typeof altitude === 'number').toBe(true);
    expect(typeof accuracy === 'number').toBe(true);
    expect(Platform.OS !== 'ios' || typeof altitudeAccuracy === 'number').toBe(true);
    expect(typeof heading === 'number').toBe(true);
    expect(typeof speed === 'number').toBe(true);
    expect(typeof timestamp === 'number').toBe(true);
  }

  describe('Location.getProviderStatusAsync()', () => {
    const timeout = 1000;
    it(
      'checks if location services are enabled',
      async () => {
        const result = await Location.getProviderStatusAsync();
        expect(result.locationServicesEnabled).not.toBe(undefined);
      },
      timeout
    );
    if (Platform.OS === 'android') {
      it(
        'detects when GPS sensor is enabled',
        async () => {
          const result = await Location.getProviderStatusAsync();
          expect(result.gpsAvailable).not.toBe(undefined);
        },
        timeout
      );
      it(
        'detects when network location is enabled',
        async () => {
          const result = await Location.getProviderStatusAsync();
          expect(result.networkAvailable).not.toBe(undefined);
        },
        timeout
      );
      it(
        'detects when passive location is enabled',
        async () => {
          const result = await Location.getProviderStatusAsync();
          expect(result.passiveAvailable).not.toBe(undefined);
        },
        timeout
      );
    }
  });

  describe('Location.enableNetworkProviderAsync()', () => {
    // To properly test this, you need to change device's location mode to "Device only" in system settings.
    // In this mode, network provider is off.

    it('asks user to enable network provider or just resolves on iOS', async () => {
      try {
        await Location.enableNetworkProviderAsync();

        if (Platform.OS === 'android') {
          const result = await Location.getProviderStatusAsync();
          expect(result.networkAvailable).toBe(true);
        }
      } catch (error) {
        // User has denied the dialog.
        expect(error.code).toBe('E_LOCATION_SETTINGS_UNSATISFIED');
      }
    }, 20000);
  });

  describeWithPermissions('Location.getCurrentPositionAsync()', () => {
    // Manual interaction:
    //   1. Just try
    //   2. iOS Settings --> General --> Reset --> Reset Location & Privacy,
    //      try gain and "Allow"
    //   3. Retry from experience restart.
    //   4. Retry from app restart.
    //   5. iOS Settings --> General --> Reset --> Reset Location & Privacy,
    //      try gain and "Don't Allow"
    //   6. Retry from experience restart.
    //   7. Retry from app restart.

    const testShapeOrUnauthorized = options => async () => {
      const providerStatus = await Location.getProviderStatusAsync();
      if (providerStatus.locationServicesEnabled) {
        const { status } = await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
          return Permissions.askAsync(Permissions.LOCATION);
        });
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync(options);
          testLocationShape(location);
        } else {
          let error;
          try {
            await Location.getCurrentPositionAsync(options);
          } catch (e) {
            error = e;
          }
          expect(error.message).toMatch(/Not authorized/);
        }
      } else {
        let error;
        try {
          await Location.getCurrentPositionAsync(options);
        } catch (e) {
          error = e;
        }
        expect(error.message).toMatch(/Location services are disabled/);
      }
    };

    const second = 1000;
    const timeout = 20 * second; // Allow manual touch on permissions dialog

    it(
      'gets a result of the correct shape (without high accuracy), or ' +
        'throws error if no permission or disabled',
      testShapeOrUnauthorized({ accuracy: Location.Accuracy.Balanced }),
      timeout
    );
    it(
      'gets a result of the correct shape (without high accuracy), or ' +
        'throws error if no permission or disabled (when trying again immediately)',
      testShapeOrUnauthorized({ accuracy: Location.Accuracy.Balanced }),
      timeout
    );
    it(
      'gets a result of the correct shape (with high accuracy), or ' +
        'throws error if no permission or disabled (when trying again immediately)',
      testShapeOrUnauthorized({ accuracy: Location.Accuracy.Highest }),
      timeout
    );

    it(
      'gets a result of the correct shape (without high accuracy), or ' +
        'throws error if no permission or disabled (when trying again after 1 second)',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testShapeOrUnauthorized({ accuracy: Location.Accuracy.Balanced })();
      },
      timeout + second
    );

    it(
      'gets a result of the correct shape (with high accuracy), or ' +
        'throws error if no permission or disabled (when trying again after 1 second)',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testShapeOrUnauthorized({ accuracy: Location.Accuracy.Highest })();
      },
      timeout + second
    );

    it(
      'resolves when called simultaneously',
      async () => {
        await Promise.all([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }),
          Location.getCurrentPositionAsync(),
        ]);
      },
      timeout
    );

    it('resolves when watchPositionAsync is running', async () => {
      const subscriber = await Location.watchPositionAsync({}, () => {});
      await Location.getCurrentPositionAsync();
      subscriber.remove();
    });
  });

  describeWithPermissions('Location.watchPositionAsync()', () => {
    it('gets a result of the correct shape', async () => {
      await new Promise(async (resolve, reject) => {
        const subscriber = await Location.watchPositionAsync({}, location => {
          testLocationShape(location);
          subscriber.remove();
          resolve();
        });
      });
    });

    it('can be called simultaneously', async () => {
      const spies = [1, 2, 3].map(number => t.jasmine.createSpy(`watchPosition${number}`));

      const subscribers = await Promise.all(spies.map(spy => Location.watchPositionAsync({}, spy)));

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          spies.forEach(spy => expect(spy).toHaveBeenCalled());
          resolve();
        }, 1000);
      });

      subscribers.forEach(subscriber => subscriber.remove());
    });
  });

  describeWithPermissions('Location.getHeadingAsync()', () => {
    const testCompass = options => async () => {
      // Disable Compass Test if in simulator
      if (Constants.isDevice) {
        const { status } = await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
          return Permissions.askAsync(Permissions.LOCATION);
        });
        if (status === 'granted') {
          const heading = await Location.getHeadingAsync();
          expect(typeof heading.magHeading === 'number').toBe(true);
          expect(typeof heading.trueHeading === 'number').toBe(true);
          expect(typeof heading.accuracy === 'number').toBe(true);
        } else {
          let error;
          try {
            await Location.getHeadingAsync();
          } catch (e) {
            error = e;
          }
          expect(error.message).toMatch(/Not authorized/);
        }
      }
    };
    const second = 1000;
    const timeout = 20 * second; // Allow manual touch on permissions dialog

    it(
      'Checks if compass is returning right values (trueHeading, magHeading, accuracy)',
      testCompass(),
      timeout
    );
  });

  describe('Location.geocodeAsync()', () => {
    const timeout = 2000;

    it(
      'geocodes a place of the right shape',
      async () => {
        const result = await Location.geocodeAsync('900 State St, Salem, OR');
        expect(Array.isArray(result)).toBe(true);
        expect(typeof result[0]).toBe('object');
        const { latitude, longitude, accuracy, altitude } = result[0];
        expect(typeof latitude).toBe('number');
        expect(typeof longitude).toBe('number');
        expect(typeof accuracy).toBe('number');
        expect(typeof altitude).toBe('number');
      },
      timeout
    );

    it(
      'returns an empty array when the address is not found',
      async () => {
        const result = await Location.geocodeAsync(':(');
        expect(result).toEqual([]);
      },
      timeout
    );
  });

  describe('Location.reverseGeocodeAsync()', () => {
    const timeout = 2000;

    it(
      'gives a right shape address of a point location',
      async () => {
        const result = await Location.reverseGeocodeAsync({
          latitude: 60.166595,
          longitude: 24.944865,
        });
        expect(Array.isArray(result)).toBe(true);
        expect(typeof result[0]).toBe('object');
        const fields = ['city', 'street', 'region', 'country', 'postalCode', 'name'];
        fields.forEach(field => {
          t.expect(typeof result[field] === 'string' || typeof result[field] === 'undefined').toBe(
            true
          );
        });
      },
      timeout
    );

    it("throws for a location where `latitude` and `longitude` aren't numbers", async () => {
      let error;
      try {
        await Location.reverseGeocodeAsync({
          latitude: '60',
          longitude: '24',
        });
      } catch (e) {
        error = e;
      }
      expect(error instanceof TypeError).toBe(true);
    });
  });

  describe('Location.hasServicesEnabledAsync()', () => {
    it('checks if location services are enabled', async () => {
      const result = await Location.hasServicesEnabledAsync();
      expect(result).toBe(true);
    });
  });

  describeWithPermissions('Location - background location updates', () => {
    async function expectTaskAccuracyToBe(accuracy) {
      const locationTask = await TaskManager.getTaskOptionsAsync(BACKGROUND_LOCATION_TASK);

      expect(locationTask).toBeDefined();
      expect(locationTask.accuracy).toBe(accuracy);
    }

    it('starts location updates', async () => {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    });

    it('has started location updates', async () => {
      const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      expect(started).toBe(true);
    });

    it('defaults to balanced accuracy', async () => {
      await expectTaskAccuracyToBe(Location.Accuracy.Balanced);
    });

    it('can update existing task', async () => {
      const newAccuracy = Location.Accuracy.Highest;
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: newAccuracy,
      });
      expectTaskAccuracyToBe(newAccuracy);
    });

    it('stops location updates', async () => {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    });

    it('has stopped location updates', async () => {
      const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      expect(started).toBe(false);
    });
  });

  describeWithPermissions('Location - geofencing', () => {
    const regions = [
      {
        identifier: 'Kraków, Poland',
        radius: 8000,
        latitude: 50.0468548,
        longitude: 19.9348341,
        notifyOnEntry: true,
        notifyOnExit: true,
      },
      {
        identifier: 'Apple',
        radius: 1000,
        latitude: 37.3270145,
        longitude: -122.0310273,
        notifyOnEntry: true,
        notifyOnExit: true,
      },
    ];

    async function expectTaskRegionsToBeLike(regions) {
      const geofencingTask = await TaskManager.getTaskOptionsAsync(GEOFENCING_TASK);

      expect(geofencingTask).toBeDefined();
      expect(geofencingTask.regions).toBeDefined();
      expect(geofencingTask.regions.length).toBe(regions.length);

      for (let i = 0; i < regions.length; i++) {
        expect(geofencingTask.regions[i].identifier).toBe(regions[i].identifier);
        expect(geofencingTask.regions[i].radius).toBe(regions[i].radius);
        expect(geofencingTask.regions[i].latitude).toBe(regions[i].latitude);
        expect(geofencingTask.regions[i].longitude).toBe(regions[i].longitude);
      }
    }

    it('starts geofencing', async () => {
      await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
    });

    it('has started geofencing', async () => {
      const started = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
      expect(started).toBe(true);
    });

    it('is monitoring correct regions', async () => {
      expectTaskRegionsToBeLike(regions);
    });

    it('can update geofencing regions', async () => {
      const newRegions = regions.slice(1);
      await Location.startGeofencingAsync(GEOFENCING_TASK, newRegions);
      expectTaskRegionsToBeLike(newRegions);
    });

    it('stops geofencing', async () => {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
    });

    it('has stopped geofencing', async () => {
      const started = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
      expect(started).toBe(false);
    });

    it('throws when starting geofencing with incorrect regions', async () => {
      await (async () => {
        let error;
        try {
          await Location.startGeofencingAsync(GEOFENCING_TASK, []);
        } catch (e) {
          error = e;
        }
        expect(error instanceof Error).toBe(true);
      })();

      await (async () => {
        let error;
        try {
          await Location.startGeofencingAsync(GEOFENCING_TASK, [{ longitude: 'not a number' }]);
        } catch (e) {
          error = e;
        }
        expect(error instanceof TypeError).toBe(true);
      })();
    });
  });
}

// Define empty tasks, otherwise tasks might automatically unregister themselves if no task is defined.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, () => {});
TaskManager.defineTask(GEOFENCING_TASK, () => {});
