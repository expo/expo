'use strict';

import { Platform } from '@unimodules/core';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';

import * as TestUtils from '../TestUtils';
import { waitFor } from './helpers';

export const name = 'expo-notifications';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  t.describe('expo-notifications', () => {
    t.describe('getDevicePushTokenAsync', () => {
      let subscription = null;
      let tokenFromEvent = null;
      let tokenFromMethodCall = null;

      t.beforeAll(() => {
        subscription = Notifications.addPushTokenListener(newEvent => {
          tokenFromEvent = newEvent;
        });
      });

      t.afterAll(() => {
        if (subscription) {
          subscription.remove();
          subscription = null;
        }
      });

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        t.it('resolves with a string', async () => {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          t.expect(typeof devicePushToken.data).toBe('string');
          tokenFromMethodCall = devicePushToken;
        });
      }

      if (Platform.OS === 'web') {
        t.it('resolves with an object', async () => {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          t.expect(typeof devicePushToken.data).toBe('object');
          tokenFromMethodCall = devicePushToken;
        });
      }

      t.it('emits an event with token (or not, if getDevicePushTokenAsync failed)', async () => {
        // It would be better to do `if (!tokenFromMethodCall) { pending(); } else { ... }`
        // but `t.pending()` still doesn't work.
        await waitFor(500);
        t.expect(tokenFromEvent).toEqual(tokenFromMethodCall);
      });

      // Not running this test on web since Expo push notification doesn't yet support web.
      const itWithExpoPushToken = ['ios', 'android'].includes(Platform.OS) ? t.it : t.xit;
      itWithExpoPushToken('fetches Expo push token', async () => {
        let experienceId = undefined;
        if (!Constants.manifest) {
          // Absence of manifest means we're running out of managed workflow
          // in bare-expo. @exponent/bare-expo "experience" has been configured
          // to use Apple Push Notification key that will work in bare-expo.
          experienceId = '@exponent/bare-expo';
        }
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          experienceId,
        });
        t.expect(expoPushToken.type).toBe('expo');
        t.expect(typeof expoPushToken.data).toBe('string');
      });
    });

    // Not running those tests on web since Expo push notification doesn't yet support web.
    const describeWithExpoPushToken = ['ios', 'android'].includes(Platform.OS)
      ? t.describe
      : t.xdescribe;

    describeWithExpoPushToken('when a push notification is sent', () => {
      let notificationToHandle;
      let handleSuccessEvent;
      let handleErrorEvent;

      let receivedEvent = null;
      let receivedSubscription = null;

      let expoPushToken;

      let handleFuncOverride;

      t.beforeAll(async () => {
        let experienceId = undefined;
        if (!Constants.manifest) {
          // Absence of manifest means we're running out of managed workflow
          // in bare-expo. @exponent/bare-expo "experience" has been configured
          // to use Apple Push Notification key that will work in bare-expo.
          experienceId = '@exponent/bare-expo';
        }
        const pushToken = await Notifications.getExpoPushTokenAsync({
          experienceId,
        });
        expoPushToken = pushToken.data;

        Notifications.setNotificationHandler({
          handleNotification: async notification => {
            notificationToHandle = notification;
            if (handleFuncOverride) {
              return await handleFuncOverride(notification);
            } else {
              return {
                shouldPlaySound: false,
                shouldSetBadge: false,
                shouldShowAlert: true,
              };
            }
          },
          handleSuccess: event => {
            handleSuccessEvent = event;
          },
          handleError: event => {
            handleErrorEvent = event;
          },
        });

        receivedSubscription = Notifications.addNotificationReceivedListener(event => {
          receivedEvent = event;
        });
      });

      t.beforeEach(async () => {
        receivedEvent = null;
        handleErrorEvent = null;
        handleSuccessEvent = null;
        notificationToHandle = null;
        await sendTestPushNotification(expoPushToken);
      });

      t.afterAll(() => {
        if (receivedSubscription) {
          receivedSubscription.remove();
          receivedSubscription = null;
        }
        Notifications.setNotificationHandler(null);
      });

      t.it('calls the `handleNotification` callback of the notification handler', async () => {
        let iterations = 0;
        while (iterations < 5) {
          iterations += 1;
          if (notificationToHandle) {
            break;
          }
          await waitFor(1000);
        }
        t.expect(notificationToHandle).not.toBeNull();
      });

      t.it('emits a “notification received” event', async () => {
        let iterations = 0;
        while (iterations < 5) {
          iterations += 1;
          if (receivedEvent) {
            break;
          }
          await waitFor(1000);
        }
        t.expect(receivedEvent).not.toBeNull();
      });

      t.describe('if handler responds in time', async () => {
        t.it(
          'calls `handleSuccess` callback of the notification handler',
          async () => {
            let iterations = 0;
            while (iterations < 5) {
              iterations += 1;
              if (handleSuccessEvent) {
                break;
              }
              await waitFor(1000);
            }
            t.expect(handleSuccessEvent).not.toBeNull();
            t.expect(handleErrorEvent).toBeNull();
          },
          10000
        );
      });

      t.describe('if handler fails to respond in time', async () => {
        t.beforeAll(() => {
          handleFuncOverride = async () => {
            await waitFor(3000);
            return {
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowAlert: true,
            };
          };
        });

        t.afterAll(() => {
          handleFuncOverride = null;
        });

        t.it(
          'calls `handleError` callback of the notification handler',
          async () => {
            let iterations = 0;
            while (iterations < 5) {
              iterations += 1;
              if (handleErrorEvent) {
                break;
              }
              await waitFor(1000);
            }
            t.expect(handleErrorEvent).not.toBeNull();
            t.expect(handleSuccessEvent).toBeNull();
          },
          10000
        );
      });
    });

    t.describe('getPermissionsAsync', () => {
      t.it('resolves with an object', async () => {
        const permissions = await Notifications.getPermissionsAsync();
        t.expect(permissions).toBeDefined();
        t.expect(typeof permissions).toBe('object');
      });
    });

    describeWithPermissions('requestPermissionsAsync', () => {
      t.it('resolves without any arguments', async () => {
        const permissions = await Notifications.requestPermissionsAsync();
        t.expect(permissions).toBeDefined();
        t.expect(typeof permissions).toBe('object');
      });

      t.it('resolves with specific permissions requested', async () => {
        const permissions = await Notifications.requestPermissionsAsync({
          providesAppNotificationSettings: true,
          allowsAlert: true,
          allowsBadge: true,
          allowsSound: true,
        });
        t.expect(permissions).toBeDefined();
        t.expect(typeof permissions).toBe('object');
      });
    });

    t.describe('presentNotificationAsync', () => {
      t.it('presents a simple notification', async () => {
        await Notifications.presentNotificationAsync({
          title: 'Sample title',
          subtitle: 'What an event!',
          message: 'An interesting event has just happened',
          badge: 1,
        });
      });

      t.it('presents a notification with attachments', async () => {
        const fileUri = FileSystem.documentDirectory + 'expo-notifications-test-image.jpg';
        await FileSystem.downloadAsync('http://placekitten.com/200/300', fileUri);
        await Notifications.presentNotificationAsync({
          title: 'Look at that kitten! ➡️',
          message: 'What a cutie!',
          ios: {
            attachments: [{ uri: fileUri }],
          },
          android: {
            thumbnailUri: fileUri,
          },
        });
      });
    });
  });
}

// In this test app we contact the Expo push service directly. You *never*
// should do this in a real app. You should always store the push tokens on your
// own server or use the local notification API if you want to notify this user.
const PUSH_ENDPOINT = 'https://expo.io/--/api/v2/push/send';

async function sendTestPushNotification(expoPushToken, notificationOverrides) {
  // POST the token to the Expo push server
  const response = await fetch(PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        to: expoPushToken,
        title: 'Hello from Expo server!',
        ...notificationOverrides,
      },
    ]),
  });

  const result = await response.json();
  if (result.errors) {
    for (const error of result.errors) {
      console.warn(`API error sending push notification:`, error);
    }
    throw new Error('API error has occurred.');
  }

  const receipts = result.data;
  if (receipts) {
    const receipt = receipts[0];
    if (receipt.status === 'error') {
      if (receipt.details) {
        console.warn(
          `Expo push service reported an error sending a notification: ${receipt.details.error}`
        );
      }
      if (receipt.__debug) {
        console.warn(receipt.__debug);
      }
      throw new Error(`API error has occurred: ${receipt.details.error}`);
    }
  }
}
