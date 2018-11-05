'use strict';

import { Permissions } from 'expo';
import { Platform } from 'react-native';

export const name = 'Permissions';

export function test(t) {
  t.describe('Permissions.getAsync', () => {
    t.describe('of Permissions.NOTIFICATIONS', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        const keys = Object.keys(result);
        const notificationsResult = result.permissions && result.permissions[Permissions.NOTIFICATIONS];
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
          t.expect(notificationsResultKeys).toContain('allowsSound');
          t.expect(notificationsResultKeys).toContain('allowsAlert');
          t.expect(notificationsResultKeys).toContain('allowsBadge');
        }
      });
    });

    t.describe('of Permissions.USER_FACING_NOTIFICATIONS', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.USER_FACING_NOTIFICATIONS);
        const keys = Object.keys(result);
        const notificationsResult = result.permissions && result.permissions[Permissions.USER_FACING_NOTIFICATIONS];
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
          t.expect(notificationsResultKeys).toContain('allowsSound');
          t.expect(notificationsResultKeys).toContain('allowsAlert');
          t.expect(notificationsResultKeys).toContain('allowsBadge');
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

    t.describe('of [Permissions.CAMERA, Permissions.SMS, Permissions.CALENDAR]', () => {
      t.it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.CAMERA, Permissions.SMS, Permissions.CALENDAR);
        const keys = Object.keys(result);
        const permissionsKeys = Object.keys(result.permissions);

        // check top-level
        t.expect(keys).toContain('status');
        t.expect(keys).toContain('expires');
        t.expect(keys).toContain('permissions');

        // check component level
        t.expect(permissionsKeys).toContain(Permissions.CAMERA);
        t.expect(permissionsKeys).toContain(Permissions.SMS);
        t.expect(permissionsKeys).toContain(Permissions.CALENDAR);

        const cameraPermissionKeys = Object.keys(result.permissions[Permissions.CAMERA]);
        t.expect(cameraPermissionKeys).toContain('status');
        t.expect(cameraPermissionKeys).toContain('expires');

        const SMSPermissionKeys = Object.keys(result.permissions[Permissions.SMS]);
        t.expect(SMSPermissionKeys).toContain('status');
        t.expect(SMSPermissionKeys).toContain('expires');

        const calendarPermissionKeys = Object.keys(result.permissions[Permissions.CALENDAR]);
        t.expect(calendarPermissionKeys).toContain('status');
        t.expect(calendarPermissionKeys).toContain('expires');
      });
    });
  });
}
