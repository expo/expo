'use strict';

import { Platform } from 'react-native';

import { Location, Permissions, Constants } from 'expo';
import * as TestUtils from '../TestUtils';

export const name = 'Location';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  t.describe('Location', () => {
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
            const {
              coords: { latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed },
              timestamp,
            } = await Location.getCurrentPositionAsync(options);
            t.expect(typeof latitude === 'number').toBe(true);
            t.expect(typeof longitude === 'number').toBe(true);
            t.expect(typeof altitude === 'number').toBe(true);
            t.expect(typeof accuracy === 'number').toBe(true);
            t.expect(Platform.OS !== 'ios' || typeof altitudeAccuracy === 'number').toBe(true);
            t.expect(typeof heading === 'number').toBe(true);
            t.expect(typeof speed === 'number').toBe(true);
            t.expect(typeof timestamp === 'number').toBe(true);
          } else {
            let error;
            try {
              await Location.getCurrentPositionAsync(options);
            } catch (e) {
              error = e;
            }
            t.expect(error.message).toMatch(/Not authorized/);
          }
        } else {
          let error;
          try {
            await Location.getCurrentPositionAsync(options);
          } catch (e) {
            error = e;
          }
          t.expect(error.message).toMatch(/Location services are disabled/);
        }
      };

      const second = 1000;
      const timeout = 20 * second; // Allow manual touch on permissions dialog

      t.it(
        'gets a result of the correct shape (without high accuracy), or ' +
          'throws error if no permission or disabled',
        testShapeOrUnauthorized({ enableHighAccuracy: false }),
        timeout
      );
      t.it(
        'gets a result of the correct shape (without high accuracy), or ' +
          'throws error if no permission or disabled (when trying again immediately)',
        testShapeOrUnauthorized({ enableHighAccuracy: false }),
        timeout
      );
      t.it(
        'gets a result of the correct shape (with high accuracy), or ' +
          'throws error if no permission or disabled (when trying again immediately)',
        testShapeOrUnauthorized({ enableHighAccuracy: true }),
        timeout
      );

      t.it(
        'gets a result of the correct shape (without high accuracy), or ' +
          'throws error if no permission or disabled (when trying again after 1 second)',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await testShapeOrUnauthorized({ enableHighAccuracy: false })();
        },
        timeout + second
      );

      t.it(
        'gets a result of the correct shape (with high accuracy), or ' +
          'throws error if no permission or disabled (when trying again after 1 second)',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await testShapeOrUnauthorized({ enableHighAccuracy: true })();
        },
        timeout + second
      );
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
            console.log(heading);
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
            t
              .expect(typeof result[field] === 'string' || typeof result[field] === 'undefined')
              .toBe(true);
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
  });
}
