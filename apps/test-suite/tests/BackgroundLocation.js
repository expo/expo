'use strict';
import { Location, TaskManager } from 'expo';

import * as TestUtils from '../TestUtils';

const BACKGROUND_LOCATION_TASK = 'background-location-updates';

export const name = 'Background Location';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

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
}

// Define empty tasks, otherwise tasks might automatically unregister themselves if no task is defined.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, () => {});
