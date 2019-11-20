'use strict';

import { isMatch } from 'lodash';
import { Platform } from 'react-native';
import { Notifications } from 'expo';

import * as Permissions from 'expo-permissions';

import { waitFor } from './helpers';
import * as TestUtils from '../TestUtils';

export const name = 'Notifications';

export function canRunAsync({ isAutomated }) {
  return !isAutomated;
}
export function requiresPermissions() {
  return [
    Permissions.NOTIFICATIONS,
    Permissions.USER_FACING_NOTIFICATIONS,
  ]
}

const localNotificationFactory = overrides => ({
  title: 'Notification title',
  body: 'Body text of the notification',
  ...overrides,
});

// We need to accumulate notifications, because listener of current test
// was being notified of notifications scheduled by previous tests.
const waitForCallOfListener = (notificationOverrides, options) =>
  new Promise(async (resolve, reject) => {
    let timeout = options ? options.timeout : null;
    let notificationsCount = (options ? options.notificationsCount : null) || (timeout ? null : 1);
    let executorFunction =
      (options ? options.executor : null) || Notifications.presentLocalNotificationAsync;
    let subscription = null;
    let notifications = [];

    const finish = () => {
      if (subscription) {
        subscription.remove();
      }
      resolve(notifications);
    };

    const listener = notification => {
      notifications.push(notification);
      if (notificationsCount === notifications.length) {
        finish();
      }
    };
    subscription = Notifications.addListener(listener);
    executorFunction(localNotificationFactory(notificationOverrides)).catch(reject);
    if (timeout) {
      await waitFor(timeout);
      finish();
    }
  });

export async function test({
  beforeAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  jasmine,
  expect,
  ...t
}) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : describe;

  describeWithPermissions('Notifications', () => {
    beforeAll(async () => {
      await Permissions.askAsync(Permissions.NOTIFICATIONS);
    });

    afterEach(async () => {
      if (Platform.OS === 'android') {
        await Notifications.dismissAllNotificationsAsync();
      }
    });

    describe('getExpoPushTokenAsync', () => {
      it('resolves with a string', async () => {
        const expoPushToken = await Notifications.getExpoPushTokenAsync();
        expect(typeof expoPushToken === 'string').toBe(true);
      });
    });

    describe('presentLocalNotificationAsync', () => {
      it('resolves with notificationId', async () => {
        let error = null;
        try {
          const notificationId = await Notifications.presentLocalNotificationAsync(
            localNotificationFactory()
          );
          expect(notificationId).toBeDefined();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });

      // It turns out iOS rejects such notifications, while Android does not.
      if (Platform.OS === 'ios') {
        it('rejects notification with empty body', async () => {
          let error = null;
          try {
            await Notifications.presentLocalNotificationAsync(
              localNotificationFactory({ body: null })
            );
          } catch (e) {
            error = e;
          }
          expect(error).not.toBeNull();
        });
      }

      it('rejects notification with empty title', async () => {
        let error = null;
        try {
          await Notifications.presentLocalNotificationAsync(
            localNotificationFactory({ title: null })
          );
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
      });
    });

    describe('addListener', () => {
      it('is notified of new notifications', async () => {
        const notificationsListener = t.jasmine.createSpy('notificationsListener');
        const subscription = Notifications.addListener(notificationsListener);
        await Notifications.presentLocalNotificationAsync(localNotificationFactory());
        await waitFor(500);
        expect(notificationsListener).toHaveBeenCalled();
        subscription.remove();
      });

      it('reported notifications have origin=received', async () => {
        const notifications = await waitForCallOfListener();
        expect(isMatch(notifications[0], { origin: 'received' })).toBe(true);
      });

      it('reported notifications have proper data attached', async () => {
        const data = { scheduledAt: new Date().getTime() };
        const notifications = await waitForCallOfListener({ data }, { timeout: 1000 });
        let hasMatched = false;
        notifications.forEach(notification => {
          hasMatched = hasMatched || isMatch(notification, { data });
        });
        expect(hasMatched).toBe(true);
      });
    });

    describe('scheduleLocalNotificationAsync', () => {
      // Android schedules notifications in a too unpredictable manner for it to be testable.
      if (Platform.OS === 'ios') {
        it('schedules local notifications', async () => {
          const notificationsListener = jasmine.createSpy('notificationsListener');
          const subscription = Notifications.addListener(notificationsListener);
          Notifications.scheduleLocalNotificationAsync(localNotificationFactory(), {
            time: new Date().getTime() + 1000,
          });
          await waitFor(800);
          expect(notificationsListener).not.toHaveBeenCalled();
          await waitFor(500);
          expect(notificationsListener).toHaveBeenCalled();
          subscription.remove();
        });

        it('data is properly set', async () => {
          const data = { scheduledAt: new Date().getTime() };
          const notifications = await waitForCallOfListener(
            { data },
            {
              timeout: 3000,
              executor: notification =>
                Notifications.scheduleLocalNotificationAsync(notification, {
                  time: new Date().getTime() + 1000,
                }),
            }
          );
          let hasMatched = false;
          notifications.forEach(notification => {
            hasMatched = hasMatched || isMatch(notification, { data });
          });
          expect(hasMatched).toBe(true);
        });
      }
    });

    if (Platform.OS === 'android') {
      describe('cancelScheduledNotificationAsync', () => {
        it('cancels a scheduled notification', async () => {
          let error = null;
          try {
            const data = { scheduledAt: new Date().getTime() };
            const notificationId = await Notifications.scheduleLocalNotificationAsync(
              localNotificationFactory(),
              {
                time: new Date().getTime() + 1000,
              }
            );
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            const notifications = await waitForCallOfListener(null, {
              timeout: 3000,
              executor: async () => { },
            });
            let hasMatched = false;
            notifications.forEach(notification => {
              hasMatched = hasMatched || isMatch(notification, { data });
            });
            expect(hasMatched).toBe(false);
          } catch (e) {
            error = e;
          }
          expect(error).toBeNull();
        });
      });

      describe('cancelAllScheduledNotificationsAsync', () => {
        it('cancels a scheduled notification', async () => {
          let error = null;
          try {
            const data = { scheduledAt: new Date().getTime() };
            await Notifications.scheduleLocalNotificationAsync(localNotificationFactory(), {
              time: new Date().getTime() + 1000,
            });
            await Notifications.cancelAllScheduledNotificationsAsync();
            const notifications = await waitForCallOfListener(null, {
              timeout: 3000,
              executor: async () => { },
            });
            let hasMatched = false;
            notifications.forEach(notification => {
              hasMatched = hasMatched || isMatch(notification, { data });
            });
            expect(hasMatched).toBe(false);
          } catch (e) {
            error = e;
          }
          expect(error).toBeNull();
        });
      });
    }

    if (Platform.OS === 'ios') {
      describe('getBadgeNumberAsync', () => {
        it('resolves with a number', async () => {
          const badgeNumber = await Notifications.getBadgeNumberAsync();
          expect(typeof badgeNumber === 'number').toBe(true);
        });
      });

      describe('setBadgeNumberAsync', () => {
        afterEach(async () => await Notifications.setBadgeNumberAsync(0));

        it('sets the badge number', async () => {
          await Notifications.setBadgeNumberAsync(10);
          const badgeNumber = await Notifications.getBadgeNumberAsync();
          expect(badgeNumber).toEqual(10);
        });
      });
    }
  });
}
