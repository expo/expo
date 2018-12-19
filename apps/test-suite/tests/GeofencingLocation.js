'use strict';
import { Location, TaskManager } from 'expo';

import { Platform } from 'expo-core';
import * as TestUtils from '../TestUtils';

const GEOFENCING_TASK = 'geofencing-task';

export const name = 'Geofencing Location';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('Location - geofencing', () => {
    /* Web is not currently supported */
    if (Platform.OS === 'web') {
      return;
    }

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

// Define empty tasks, otherwise tasks might automatically unregister themselves if no task is defined.
TaskManager.defineTask(GEOFENCING_TASK, () => {});
