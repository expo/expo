'use strict';

import { Platform } from '@unimodules/core';
import * as Notifications from 'expo-notifications';

import * as TestUtils from '../TestUtils';

export const name = 'expo-notifications';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('expo-notifications', () => {
    t.describe('getDevicePushTokenAsync', () => {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        t.it('resolves with a string', async () => {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          console.log(devicePushToken);
          t.expect(typeof devicePushToken.data === 'string').toBe(true);
        });
      }

      if (Platform.OS === 'web') {
        t.it('resolves with an object', async () => {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          t.expect(typeof devicePushToken.data === 'object').toBe(true);
        });
      }
    });
  });
}
