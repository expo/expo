import {
  Location,
  LocationProfile,
  LocationUpdatesHandle,
  PositionWatchHandle,
  type Position,
} from 'expo-location/next';

import * as TestUtils from '../TestUtils';
import type { JasmineInterface } from '../types';
import {
  BACKGROUND_LOCATION_TASK,
  describeForEachProvider,
  expectPosition,
  nextTaskPosition,
  PERMISSION_TIMEOUT,
  POSITION_TIMEOUT,
  TASK_TIMEOUT,
} from './LocationNextHelpers';

export const name = 'Location@Next Delivery';

export async function test(t: JasmineInterface) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions(
    'Location (next) delivery, each spec waits for a new fix and may take long',
    () => {
      t.beforeAll(async () => {
        await TestUtils.acceptPermissionsAndRunCommandAsync(() =>
          Location.requestForegroundPermissions()
        );
        await TestUtils.acceptPermissionsAndRunCommandAsync(() =>
          Location.requestBackgroundPermissions()
        );
      }, PERMISSION_TIMEOUT * 2);

      describeForEachProvider(t, () => {
        t.describe('Location.watchPosition()', () => {
          t.it(
            'delivers a position of the documented shape, waits for a new fix',
            async () => {
              let handle: PositionWatchHandle | undefined;
              try {
                const position = await new Promise<Position>((resolve, reject) => {
                  handle = Location.watchPosition({
                    profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
                    onPosition: resolve,
                    onError: (error) => reject(new Error(`${error.code}: ${error.message}`)),
                  });
                });
                expectPosition(t, position);
              } finally {
                handle?.dispose();
              }
            },
            POSITION_TIMEOUT
          );
        });

        t.describe('Location.LocationUpdatesHandle', () => {
          t.beforeAll(async () => {
            await new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).stop();
          });

          t.afterAll(async () => {
            await new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).stop();
          });

          t.it(
            'delivers a position to the task, waits for a new fix',
            async () => {
              const handle = new LocationUpdatesHandle(BACKGROUND_LOCATION_TASK).withProfile(
                LocationProfile.AUTOMOTIVE_NAVIGATION
              );
              const [position] = await Promise.all([
                nextTaskPosition(POSITION_TIMEOUT),
                handle.start(),
              ]);
              expectPosition(t, position);
            },
            POSITION_TIMEOUT + TASK_TIMEOUT
          );
        });
      });
    }
  );
}
