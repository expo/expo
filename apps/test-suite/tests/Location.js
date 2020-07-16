'use strict';

import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';

const BACKGROUND_LOCATION_TASK = 'background-location-updates';
const GEOFENCING_TASK = 'geofencing-task';

export const name = 'Location';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  const testShapeOrUnauthorized = testFunction => async () => {
    const providerStatus = await Location.getProviderStatusAsync();
    if (providerStatus.locationServicesEnabled) {
      const { status } = await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return Permissions.askAsync(Permissions.LOCATION);
      });
      if (status === 'granted') {
        const location = await testFunction();
        testLocationShape(location);
      } else {
        let error;
        try {
          await testFunction();
        } catch (e) {
          error = e;
        }
        t.expect(error.message).toMatch(/Not authorized/);
      }
    } else {
      let error;
      try {
        await testFunction();
      } catch (e) {
        error = e;
      }
      t.expect(error.message).toMatch(/Location services are disabled/);
    }
  };

  function testLocationShape(location) {
    t.expect(typeof location === 'object').toBe(true);

    const { coords, timestamp } = location;
    const { latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed } = coords;

    t.expect(typeof latitude === 'number').toBe(true);
    t.expect(typeof longitude === 'number').toBe(true);
    t.expect(typeof altitude === 'number' || altitude === null).toBe(true);
    t.expect(typeof accuracy === 'number' || accuracy === null).toBe(true);
    t.expect(typeof altitudeAccuracy === 'number' || altitudeAccuracy === null).toBe(true);
    t.expect(typeof heading === 'number' || heading === null).toBe(true);
    t.expect(typeof speed === 'number' || speed === null).toBe(true);
    t.expect(typeof timestamp === 'number').toBe(true);
  }

  t.describe('Location', () => {
    describeWithPermissions('Location.requestPermissionsAsync()', () => {
      t.it('requests for permissions', async () => {
        const permission = await Location.requestPermissionsAsync();
        t.expect(permission.granted).toBe(true);
        t.expect(permission.status).toBe(Location.PermissionStatus.GRANTED);
      });
    });

    describeWithPermissions('Location.getPermissionsAsync()', () => {
      t.it('gets location permissions', async () => {
        const permission = await Location.getPermissionsAsync();
        t.expect(permission.granted).toBe(true);
        t.expect(permission.status).toBe(Location.PermissionStatus.GRANTED);
      });
    });

    t.describe('Location.hasServicesEnabledAsync()', () => {
      t.it('checks if location services are enabled', async () => {
        const result = await Location.hasServicesEnabledAsync();
        t.expect(result).toBe(true);
      });
    });

    t.describe('Location.getProviderStatusAsync()', () => {
      const timeout = 1000;
      t.it(
        'checks if location services are enabled',
        async () => {
          const result = await Location.getProviderStatusAsync();
          t.expect(result.locationServicesEnabled).not.toBe(undefined);
        },
        timeout
      );
      if (Platform.OS === 'android') {
        t.it(
          'detects when GPS sensor is enabled',
          async () => {
            const result = await Location.getProviderStatusAsync();
            t.expect(result.gpsAvailable).not.toBe(undefined);
          },
          timeout
        );
        t.it(
          'detects when network location is enabled',
          async () => {
            const result = await Location.getProviderStatusAsync();
            t.expect(result.networkAvailable).not.toBe(undefined);
          },
          timeout
        );
        t.it(
          'detects when passive location is enabled',
          async () => {
            const result = await Location.getProviderStatusAsync();
            t.expect(result.passiveAvailable).not.toBe(undefined);
          },
          timeout
        );
      }
    });

    t.describe('Location.enableNetworkProviderAsync()', () => {
      // To properly test this, you need to change device's location mode to "Device only" in system settings.
      // In this mode, network provider is off.

      t.it(
        'asks user to enable network provider or just resolves on iOS',
        async () => {
          try {
            await Location.enableNetworkProviderAsync();

            if (Platform.OS === 'android') {
              const result = await Location.getProviderStatusAsync();
              t.expect(result.networkAvailable).toBe(true);
            }
          } catch (error) {
            // User has denied the dialog.
            t.expect(error.code).toBe('E_LOCATION_SETTINGS_UNSATISFIED');
          }
        },
        20000
      );
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
      const second = 1000;
      const timeout = 20 * second; // Allow manual touch on permissions dialog

      t.it(
        'gets a result of the correct shape (without high accuracy), or ' +
          'throws error if no permission or disabled',
        testShapeOrUnauthorized(() =>
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
        ),
        timeout
      );
      t.it(
        'gets a result of the correct shape (without high accuracy), or ' +
          'throws error if no permission or disabled (when trying again immediately)',
        testShapeOrUnauthorized(() =>
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
        ),
        timeout
      );
      t.it(
        'gets a result of the correct shape (with high accuracy), or ' +
          'throws error if no permission or disabled (when trying again immediately)',
        testShapeOrUnauthorized(() =>
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          })
        ),
        timeout
      );

      t.it(
        'gets a result of the correct shape (without high accuracy), or ' +
          'throws error if no permission or disabled (when trying again after 1 second)',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await testShapeOrUnauthorized(() =>
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            })
          )();
        },
        timeout + second
      );

      t.it(
        'gets a result of the correct shape (with high accuracy), or ' +
          'throws error if no permission or disabled (when trying again after 1 second)',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await testShapeOrUnauthorized(() =>
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Highest,
            })
          )();
        },
        timeout + second
      );

      t.it(
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

      t.it('resolves when watchPositionAsync is running', async () => {
        const subscriber = await Location.watchPositionAsync({}, () => {});
        await Location.getCurrentPositionAsync();
        subscriber.remove();
      });
    });

    describeWithPermissions('Location.getLastKnownPositionAsync()', () => {
      const second = 1000;
      const timeout = 20 * second; // Allow manual touch on permissions dialog

      t.it(
        'gets a result of the correct shape, or throws error if no permission or disabled',
        testShapeOrUnauthorized(() => Location.getLastKnownPositionAsync()),
        timeout
      );

      t.it(
        'returns the same or newer location as previously ran `getCurrentPositionAsync`',
        async () => {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
          const lastKnown = await Location.getLastKnownPositionAsync();

          t.expect(current).not.toBeNull();
          t.expect(lastKnown).not.toBeNull();
          t.expect(lastKnown.timestamp).toBeGreaterThanOrEqual(current.timestamp);
        }
      );

      t.it('returns null if maxAge is zero', async () => {
        const location = await Location.getLastKnownPositionAsync({ maxAge: 0 });
        t.expect(location).toBeNull();
      });

      t.it('returns null if maxAge is negative', async () => {
        const location = await Location.getLastKnownPositionAsync({ maxAge: -1000 });
        t.expect(location).toBeNull();
      });

      t.it("returns location that doesn't exceed maxAge or null", async () => {
        const maxAge = 5000;
        const timestampBeforeCall = Date.now();
        const location = await Location.getLastKnownPositionAsync({ maxAge });

        if (location !== null) {
          t.expect(timestampBeforeCall - location.timestamp).toBeLessThan(maxAge);
        }
      });

      t.it('returns location with required accuracy or null', async () => {
        const requiredAccuracy = 70;
        const location = await Location.getLastKnownPositionAsync({ requiredAccuracy });

        if (location !== null) {
          t.expect(location.coords.accuracy).toBeLessThanOrEqual(requiredAccuracy);
        }
      });

      t.it('returns null if required accuracy is zero', async () => {
        const location = await Location.getLastKnownPositionAsync({
          requiredAccuracy: 0,
        });
        t.expect(location).toBeNull();
      });

      t.it(
        'resolves when called simultaneously',
        async () => {
          await Promise.all([
            Location.getLastKnownPositionAsync(),
            Location.getLastKnownPositionAsync({ maxAge: 1000 }),
            Location.getLastKnownPositionAsync({ requiredAccuracy: 100 }),
          ]);
        },
        timeout
      );

      t.it('resolves when watchPositionAsync is running', async () => {
        const subscriber = await Location.watchPositionAsync({}, () => {});
        await Location.getLastKnownPositionAsync();
        subscriber.remove();
      });
    });

    describeWithPermissions('Location.watchPositionAsync()', () => {
      t.it('gets a result of the correct shape', async () => {
        await new Promise(async (resolve, reject) => {
          const subscriber = await Location.watchPositionAsync({}, location => {
            testLocationShape(location);
            subscriber.remove();
            resolve();
          });
        });
      });

      t.it('can be called simultaneously', async () => {
        const spies = [1, 2, 3].map(number => t.jasmine.createSpy(`watchPosition${number}`));

        const subscribers = await Promise.all(
          spies.map(spy => Location.watchPositionAsync({}, spy))
        );

        await new Promise(resolve => setTimeout(resolve, 3000));

        spies.forEach(spy => t.expect(spy).toHaveBeenCalled());
        subscribers.forEach(subscriber => subscriber.remove());
      });
    });

    if (Platform.OS !== 'web') {
      describeWithPermissions('Location.getHeadingAsync()', () => {
        const testCompass = options => async () => {
          // Disable Compass Test if in simulator
          if (Constants.isDevice) {
            const { status } = await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
              return Permissions.askAsync(Permissions.LOCATION);
            });
            if (status === 'granted') {
              const heading = await Location.getHeadingAsync();
              t.expect(typeof heading.magHeading === 'number').toBe(true);
              t.expect(typeof heading.trueHeading === 'number').toBe(true);
              t.expect(typeof heading.accuracy === 'number').toBe(true);
            } else {
              let error;
              try {
                await Location.getHeadingAsync();
              } catch (e) {
                error = e;
              }
              t.expect(error.message).toMatch(/Not authorized/);
            }
          }
        };
        const second = 1000;
        const timeout = 20 * second; // Allow manual touch on permissions dialog

        t.it(
          'Checks if compass is returning right values (trueHeading, magHeading, accuracy)',
          testCompass(),
          timeout
        );
      });

      t.describe('Location.geocodeAsync()', () => {
        const timeout = 2000;

        t.it(
          'geocodes a place of the right shape',
          async () => {
            const result = await Location.geocodeAsync('900 State St, Salem, OR');
            t.expect(Array.isArray(result)).toBe(true);
            t.expect(typeof result[0]).toBe('object');
            const { latitude, longitude, accuracy, altitude } = result[0];
            t.expect(typeof latitude).toBe('number');
            t.expect(typeof longitude).toBe('number');
            t.expect(typeof accuracy).toBe('number');
            t.expect(typeof altitude).toBe('number');
          },
          timeout
        );

        t.it(
          'returns an empty array when the address is not found',
          async () => {
            const result = await Location.geocodeAsync(':(');
            t.expect(result).toEqual([]);
          },
          timeout
        );
      });

      t.describe('Location.reverseGeocodeAsync()', () => {
        const timeout = 2000;

        t.it(
          'gives a right shape address of a point location',
          async () => {
            const result = await Location.reverseGeocodeAsync({
              latitude: 60.166595,
              longitude: 24.944865,
            });
            t.expect(Array.isArray(result)).toBe(true);
            t.expect(typeof result[0]).toBe('object');
            const fields = ['city', 'street', 'region', 'country', 'postalCode', 'name'];
            fields.forEach(field => {
              t.expect(
                typeof result[field] === 'string' || typeof result[field] === 'undefined'
              ).toBe(true);
            });
          },
          timeout
        );

        t.it("throws for a location where `latitude` and `longitude` aren't numbers", async () => {
          let error;
          try {
            await Location.reverseGeocodeAsync({
              latitude: '60',
              longitude: '24',
            });
          } catch (e) {
            error = e;
          }
          t.expect(error instanceof TypeError).toBe(true);
        });
      });

      describeWithPermissions('Location - background location updates', () => {
        async function expectTaskAccuracyToBe(accuracy) {
          const locationTask = await TaskManager.getTaskOptionsAsync(BACKGROUND_LOCATION_TASK);

          t.expect(locationTask).toBeDefined();
          t.expect(locationTask.accuracy).toBe(accuracy);
        }

        t.it('starts location updates', async () => {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        });

        t.it('has started location updates', async () => {
          const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          t.expect(started).toBe(true);
        });

        t.it('defaults to balanced accuracy', async () => {
          await expectTaskAccuracyToBe(Location.Accuracy.Balanced);
        });

        t.it('can update existing task', async () => {
          const newAccuracy = Location.Accuracy.Highest;
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: newAccuracy,
          });
          expectTaskAccuracyToBe(newAccuracy);
        });

        t.it('stops location updates', async () => {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        });

        t.it('has stopped location updates', async () => {
          const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          t.expect(started).toBe(false);
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

          t.expect(geofencingTask).toBeDefined();
          t.expect(geofencingTask.regions).toBeDefined();
          t.expect(geofencingTask.regions.length).toBe(regions.length);

          for (let i = 0; i < regions.length; i++) {
            t.expect(geofencingTask.regions[i].identifier).toBe(regions[i].identifier);
            t.expect(geofencingTask.regions[i].radius).toBe(regions[i].radius);
            t.expect(geofencingTask.regions[i].latitude).toBe(regions[i].latitude);
            t.expect(geofencingTask.regions[i].longitude).toBe(regions[i].longitude);
          }
        }

        t.it('starts geofencing', async () => {
          await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
        });

        t.it('has started geofencing', async () => {
          const started = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
          t.expect(started).toBe(true);
        });

        t.it('is monitoring correct regions', async () => {
          expectTaskRegionsToBeLike(regions);
        });

        t.it('can update geofencing regions', async () => {
          const newRegions = regions.slice(1);
          await Location.startGeofencingAsync(GEOFENCING_TASK, newRegions);
          expectTaskRegionsToBeLike(newRegions);
        });

        t.it('stops geofencing', async () => {
          await Location.stopGeofencingAsync(GEOFENCING_TASK);
        });

        t.it('has stopped geofencing', async () => {
          const started = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
          t.expect(started).toBe(false);
        });

        t.it('throws when starting geofencing with incorrect regions', async () => {
          await (async () => {
            let error;
            try {
              await Location.startGeofencingAsync(GEOFENCING_TASK, []);
            } catch (e) {
              error = e;
            }
            t.expect(error instanceof Error).toBe(true);
          })();

          await (async () => {
            let error;
            try {
              await Location.startGeofencingAsync(GEOFENCING_TASK, [{ longitude: 'not a number' }]);
            } catch (e) {
              error = e;
            }
            t.expect(error instanceof TypeError).toBe(true);
          })();
        });
      });
    }
  });
}

// Define empty tasks, otherwise tasks might automatically unregister themselves if no task is defined.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, () => {});
TaskManager.defineTask(GEOFENCING_TASK, () => {});
