'use strict';

import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';

export const name = 'Permissions';

export function canRunAsync({ isAutomated }) {
  return !isAutomated;
}

export function requiresPermissions() {
  return [
    Permissions.NOTIFICATIONS,
    Permissions.USER_FACING_NOTIFICATIONS,
    Permissions.CALENDAR,
    Permissions.CAMERA,
    Permissions.AUDIO_RECORDING,
  ];
}

export function test({ describe, afterEach, it, expect, jasmine, ...t }) {
  describe('Permissions.getAsync', () => {
    describe('of Permissions.NOTIFICATIONS', () => {
      it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        const keys = Object.keys(result);
        const notificationsResult =
          result.permissions && result.permissions[Permissions.NOTIFICATIONS];
        const notificationsResultKeys = notificationsResult && Object.keys(notificationsResult);

        // check top-level
        expect(keys).toContain('status');
        expect(keys).toContain('expires');
        expect(keys).toContain('permissions');
        expect(notificationsResult).toBeDefined();

        // check component level
        expect(notificationsResultKeys).toContain('status');
        expect(notificationsResultKeys).toContain('expires');
        if (Platform.OS === 'ios') {
          expect(notificationsResultKeys).toContain('allowsSound');
          expect(notificationsResultKeys).toContain('allowsAlert');
          expect(notificationsResultKeys).toContain('allowsBadge');
        }
      });
    });

    describe('of Permissions.USER_FACING_NOTIFICATIONS', () => {
      it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.USER_FACING_NOTIFICATIONS);
        const keys = Object.keys(result);
        const notificationsResult =
          result.permissions && result.permissions[Permissions.USER_FACING_NOTIFICATIONS];
        const notificationsResultKeys = notificationsResult && Object.keys(notificationsResult);

        // check top-level
        expect(keys).toContain('status');
        expect(keys).toContain('expires');
        expect(keys).toContain('permissions');
        expect(notificationsResult).toBeDefined();

        // check component level
        expect(notificationsResultKeys).toContain('status');
        expect(notificationsResultKeys).toContain('expires');
        if (Platform.OS === 'ios') {
          expect(notificationsResultKeys).toContain('allowsSound');
          expect(notificationsResultKeys).toContain('allowsAlert');
          expect(notificationsResultKeys).toContain('allowsBadge');
        }
      });

      if (Platform.OS === 'android') {
        it('is equal to status of notifications permission', async () => {
          const localResult = await Permissions.getAsync(Permissions.NOTIFICATIONS);
          const remoteResult = await Permissions.getAsync(Permissions.USER_FACING_NOTIFICATIONS);

          expect(remoteResult.status).toEqual(localResult.status);
          expect(remoteResult.granted).toEqual(localResult.granted);
        });
      }
    });

    describe('of Permissions.AUDIO_RECORDING', () => {
      it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.AUDIO_RECORDING);
        const keys = Object.keys(result);
        const permissionsKeys = Object.keys(result.permissions);

        // check top-level
        expect(keys).toContain('status');
        expect(keys).toContain('expires');
        expect(keys).toContain('permissions');

        // check component level
        expect(permissionsKeys).toContain(Permissions.AUDIO_RECORDING);

        const recordingPermissions = Object.keys(result.permissions[Permissions.AUDIO_RECORDING]);
        expect(recordingPermissions).toContain('status');
        expect(recordingPermissions).toContain('expires');
      });
    });

    describe('of [Permissions.CAMERA, Permissions.CALENDAR]', () => {
      it('has proper shape', async () => {
        const result = await Permissions.getAsync(Permissions.CAMERA, Permissions.CALENDAR);
        const keys = Object.keys(result);
        const permissionsKeys = Object.keys(result.permissions);

        // check top-level
        expect(keys).toContain('status');
        expect(keys).toContain('expires');
        expect(keys).toContain('permissions');

        // check component level
        expect(permissionsKeys).toContain(Permissions.CAMERA);
        expect(permissionsKeys).toContain(Permissions.CALENDAR);

        const cameraPermissionKeys = Object.keys(result.permissions[Permissions.CAMERA]);
        expect(cameraPermissionKeys).toContain('status');
        expect(cameraPermissionKeys).toContain('expires');

        const calendarPermissionKeys = Object.keys(result.permissions[Permissions.CALENDAR]);
        expect(calendarPermissionKeys).toContain('status');
        expect(calendarPermissionKeys).toContain('expires');
      });
    });
  });
}
