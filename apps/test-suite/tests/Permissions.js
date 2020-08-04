'use strict';

import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';

export const name = 'Permissions';

export function test(t) {
  t.describe('Permissions.getAsync', () => {
    t.describe('of Permissions.NOTIFICATIONS', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        const keys = Object.keys(result);
        const notificationsResult =
          result.permissions && result.permissions[Permissions.NOTIFICATIONS];
        const notificationsResultKeys = notificationsResult && Object.keys(notificationsResult);

        // check top-level
        t.expect(keys).toContain('status');
        t.expect(keys).toContain('expires');
        t.expect(keys).toContain('permissions');
        t.expect(notificationsResult).toBeDefined();

        // check component level
        t.expect(notificationsResultKeys).toContain('status');
        t.expect(notificationsResultKeys).toContain('expires');
        if (Platform.OS === 'ios') {
          // TODO: Remove once we promote `expo-notifications` to a stable unimodule (and integrate into Expo client)
          if (notificationsResultKeys.includes('ios')) {
            // expo-notifications handled permissions
            const platformResultKeys = Object.keys(notificationsResult.ios);
            t.expect(platformResultKeys).toContain('allowsSound');
            t.expect(platformResultKeys).toContain('allowsAlert');
            t.expect(platformResultKeys).toContain('allowsBadge');
          } else {
            // expo-permissions handled permissions
            t.expect(notificationsResultKeys).toContain('allowsSound');
            t.expect(notificationsResultKeys).toContain('allowsAlert');
            t.expect(notificationsResultKeys).toContain('allowsBadge');
          }
        }
      });
    });

    t.describe('of Permissions.USER_FACING_NOTIFICATIONS', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.USER_FACING_NOTIFICATIONS);
        const keys = Object.keys(result);
        const notificationsResult =
          result.permissions && result.permissions[Permissions.USER_FACING_NOTIFICATIONS];
        const notificationsResultKeys = notificationsResult && Object.keys(notificationsResult);

        // check top-level
        t.expect(keys).toContain('status');
        t.expect(keys).toContain('expires');
        t.expect(keys).toContain('permissions');
        t.expect(notificationsResult).toBeDefined();

        // check component level
        t.expect(notificationsResultKeys).toContain('status');
        t.expect(notificationsResultKeys).toContain('expires');
        if (Platform.OS === 'ios') {
          // TODO: Remove once we promote `expo-notifications` to a stable unimodule (and integrate into Expo client)
          if (notificationsResultKeys.includes('ios')) {
            // expo-notifications handled permissions
            const platformResultKeys = Object.keys(notificationsResult.ios);
            t.expect(platformResultKeys).toContain('allowsSound');
            t.expect(platformResultKeys).toContain('allowsAlert');
            t.expect(platformResultKeys).toContain('allowsBadge');
          } else {
            // expo-permissions handled permissions
            t.expect(notificationsResultKeys).toContain('allowsSound');
            t.expect(notificationsResultKeys).toContain('allowsAlert');
            t.expect(notificationsResultKeys).toContain('allowsBadge');
          }
        }
      });

      if (Platform.OS === 'android') {
        t.it('is equal to status of notifications permission', async () => {
          const localResult = await Permissions.getAsync(Permissions.NOTIFICATIONS);
          const remoteResult = await Permissions.getAsync(Permissions.USER_FACING_NOTIFICATIONS);

          t.expect(remoteResult.status).toEqual(localResult.status);
          t.expect(remoteResult.granted).toEqual(localResult.granted);
        });
      }
    });

    t.describe('of Permissions.AUDIO_RECORDING', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.AUDIO_RECORDING);
        const keys = Object.keys(result);
        const permissionsKeys = Object.keys(result.permissions);

        // check top-level
        t.expect(keys).toContain('status');
        t.expect(keys).toContain('expires');
        t.expect(keys).toContain('permissions');

        // check component level
        t.expect(permissionsKeys).toContain(Permissions.AUDIO_RECORDING);

        const recordingPermissions = Object.keys(result.permissions[Permissions.AUDIO_RECORDING]);
        t.expect(recordingPermissions).toContain('status');
        t.expect(recordingPermissions).toContain('expires');
      });
    });

    t.describe('of [Permissions.CAMERA, Permissions.CALENDAR]', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.CAMERA, Permissions.CALENDAR);
        const keys = Object.keys(result);
        const permissionsKeys = Object.keys(result.permissions);

        // check top-level
        t.expect(keys).toContain('status');
        t.expect(keys).toContain('expires');
        t.expect(keys).toContain('permissions');

        // check component level
        t.expect(permissionsKeys).toContain(Permissions.CAMERA);
        t.expect(permissionsKeys).toContain(Permissions.CALENDAR);

        const cameraPermissionKeys = Object.keys(result.permissions[Permissions.CAMERA]);
        t.expect(cameraPermissionKeys).toContain('status');
        t.expect(cameraPermissionKeys).toContain('expires');

        const calendarPermissionKeys = Object.keys(result.permissions[Permissions.CALENDAR]);
        t.expect(calendarPermissionKeys).toContain('status');
        t.expect(calendarPermissionKeys).toContain('expires');
      });
    });

    t.describe('of Permissions.CAMERA_ROLL', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.CAMERA_ROLL);
        const permissionsKeys = Object.keys(result.permissions);

        // check component level
        t.expect(permissionsKeys).toContain(Permissions.CAMERA_ROLL);

        const cameraRollPermissionKeys = Object.keys(result.permissions[Permissions.CAMERA_ROLL]);
        t.expect(cameraRollPermissionKeys).toContain('status');
        t.expect(cameraRollPermissionKeys).toContain('expires');
        if (Platform.OS === 'ios') {
          t.expect(cameraRollPermissionKeys).toContain('accessPrivileges');
        }
      });
    });

    t.describe('of Permissions.LOCATION', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.LOCATION);
        const keys = Object.keys(result);
        const permissionsKeys = Object.keys(result.permissions);

        // check top-level
        t.expect(keys).toContain('status');
        t.expect(keys).toContain('expires');
        t.expect(keys).toContain('permissions');

        t.expect(permissionsKeys).toContain(Permissions.LOCATION);
        const locationPermissionKeys = Object.keys(result.permissions[Permissions.LOCATION]);
        t.expect(locationPermissionKeys).toContain('status');
        t.expect(locationPermissionKeys).toContain('canAskAgain');
        t.expect(locationPermissionKeys).toContain('granted');
        t.expect(locationPermissionKeys).toContain('expires');

        if (Platform.OS === 'android') {
          t.expect(locationPermissionKeys).toContain('android');
          const androidLocationPermissionKeys = Object.keys(
            result.permissions[Permissions.LOCATION]['android']
          );
          t.expect(androidLocationPermissionKeys).toContain('accuracy');
        }
      });
    });
  });
}
