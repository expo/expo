'use strict';

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { Alert, AppState } from 'react-native';

import * as TestUtils from '../TestUtils';
import { isInteractive } from '../utils/Environment';
import { waitFor } from './helpers';

export const name = 'Notifications';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  t.describe('Notifications', () => {
    t.describe('getDevicePushTokenAsync', () => {
      let subscription = null;
      let tokenFromEvent = null;
      let tokenFromMethodCall = null;

      t.beforeAll(() => {
        subscription = Notifications.addPushTokenListener((newEvent) => {
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

      t.it('resolves when multiple calls are issued', async () => {
        const results = await Promise.all([
          Notifications.getDevicePushTokenAsync(),
          Notifications.getDevicePushTokenAsync(),
        ]);
        t.expect(results[0].data).toBeDefined();
        t.expect(results[0].data).toBe(results[1].data);
      });

      // Not running this test on web since Expo push notification doesn't yet support web.
      const itWithExpoPushToken = ['ios', 'android'].includes(Platform.OS) ? t.it : t.xit;
      itWithExpoPushToken('fetches Expo push token', async () => {
        let experienceId = undefined;
        if (!Constants.manifest && !Constants.manifest2) {
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

      itWithExpoPushToken('resolves when mixed multiple calls are issued', async () => {
        let experienceId = undefined;
        if (!Constants.manifest && !Constants.manifest2) {
          // Absence of manifest means we're running out of managed workflow
          // in bare-expo. @exponent/bare-expo "experience" has been configured
          // to use Apple Push Notification key that will work in bare-expo.
          experienceId = '@exponent/bare-expo';
        }
        await Promise.all([
          Notifications.getExpoPushTokenAsync({ experienceId }),
          Notifications.getDevicePushTokenAsync(),
        ]);
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
        if (!Constants.manifest && !Constants.manifest2) {
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
          handleNotification: async (notification) => {
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
          handleSuccess: (event) => {
            handleSuccessEvent = event;
          },
          handleError: (...event) => {
            handleErrorEvent = event;
          },
        });

        receivedSubscription = Notifications.addNotificationReceivedListener((event) => {
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

      t.it('the notification has proper `data` value', async () => {
        let iterations = 0;
        while (iterations < 5) {
          iterations += 1;
          if (receivedEvent) {
            break;
          }
          await waitFor(1000);
        }
        t.expect(receivedEvent.request.content.data.fieldTestedInDataContentsTest).toBe(42);
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
            t.expect(typeof handleErrorEvent[0]).toBe('string');
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
        t.expect(typeof permissions.status).toBe('string');
      });
    });

    t.describe('presentNotificationAsync', () => {
      t.it('presents a simple notification', async () => {
        await Notifications.presentNotificationAsync({
          title: 'Sample title',
          subtitle: 'What an event!',
          body: 'An interesting event has just happened',
          badge: 1,
        });
      });

      t.it('presents a notification with attachments', async () => {
        const fileUri = FileSystem.documentDirectory + 'expo-notifications-test-image.jpg';
        await FileSystem.downloadAsync('http://placekitten.com/200/300', fileUri);
        await Notifications.presentNotificationAsync({
          title: 'Look at that kitten! ➡️',
          body: 'What a cutie!',
          attachments: [{ uri: fileUri }],
        });
      });
    });

    t.describe('Notification channels', () => {
      // Implementation detail!
      const fallbackChannelId = 'expo_notifications_fallback_notification_channel';
      const fallbackChannelName = 'Miscellaneous';
      const testChannelId = 'test-channel-id';
      const testChannel = {
        name: 'Test channel',
      };

      t.describe('getNotificationChannelAsync()', () => {
        t.it('returns null if there is no such channel', async () => {
          const channel = await Notifications.getNotificationChannelAsync(
            'non-existent-channel-id'
          );
          t.expect(channel).toBe(null);
        });

        // Test push notifications sent without a channel ID should create a fallback channel
        if (Platform.OS === 'android' && Device.platformApiLevel >= 26) {
          t.it('returns an object if there is such channel', async () => {
            const channel = await Notifications.getNotificationChannelAsync(fallbackChannelId);
            t.expect(channel).toBeDefined();
          });
        }
      });

      t.describe('getNotificationChannelsAsync()', () => {
        t.it('returns an array', async () => {
          const channels = await Notifications.getNotificationChannelsAsync();
          t.expect(channels).toEqual(t.jasmine.any(Array));
        });

        // Test push notifications sent without a channel ID should create a fallback channel
        if (Platform.OS === 'android' && Device.platformApiLevel >= 26) {
          t.it('contains the fallback channel', async () => {
            const channels = await Notifications.getNotificationChannelsAsync();
            t.expect(channels).toContain(
              t.jasmine.objectContaining({
                // Implementation detail!
                id: fallbackChannelId,
                name: fallbackChannelName,
              })
            );
          });
        }
      });

      t.describe('setNotificationChannelAsync()', () => {
        t.afterEach(async () => {
          await Notifications.deleteNotificationChannelAsync(testChannelId);
        });

        if (Platform.OS === 'android' && Device.platformApiLevel >= 26) {
          t.it('returns the modified channel', async () => {
            const channel = await Notifications.setNotificationChannelAsync(
              testChannelId,
              testChannel
            );
            t.expect(channel).toEqual(
              t.jasmine.objectContaining({ ...testChannel, id: testChannelId })
            );
          });

          t.it('creates a channel', async () => {
            const preChannels = await Notifications.getNotificationChannelsAsync();
            const channelSpec = t.jasmine.objectContaining({ ...testChannel, id: testChannelId });
            t.expect(preChannels).not.toContain(channelSpec);
            await Notifications.setNotificationChannelAsync(testChannelId, testChannel);
            const postChannels = await Notifications.getNotificationChannelsAsync();
            t.expect(postChannels).toContain(channelSpec);
            t.expect(postChannels.length).toBeGreaterThan(preChannels.length);
          });

          t.it('sets custom properties', async () => {
            const spec = {
              name: 'Name',
              importance: Notifications.AndroidImportance.MIN,
              bypassDnd: true,
              description: 'Test channel',
              lightColor: '#FF231F7C',
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.SECRET,
              showBadge: false,
              sound: null,
              audioAttributes: {
                usage: Notifications.AndroidAudioUsage.NOTIFICATION_COMMUNICATION_INSTANT,
                contentType: Notifications.AndroidAudioContentType.SONIFICATION,
                flags: {
                  enforceAudibility: true,
                  requestHardwareAudioVideoSynchronization: true,
                },
              },
              vibrationPattern: [500, 500],
              enableLights: true,
              enableVibrate: true,
            };
            const channel = await Notifications.setNotificationChannelAsync(testChannelId, spec);
            t.expect(channel).toEqual(t.jasmine.objectContaining({ ...spec, id: testChannelId }));
          });

          t.it('assigns a channel to a group', async () => {
            const groupId = 'test-group-id';
            try {
              await Notifications.setNotificationChannelGroupAsync(groupId, { name: 'Test group' });
              const channel = await Notifications.setNotificationChannelAsync(testChannelId, {
                ...testChannel,
                groupId,
              });
              t.expect(channel.groupId).toBe(groupId);
              const group = await Notifications.getNotificationChannelGroupAsync(groupId);
              t.expect(group.channels).toContain(t.jasmine.objectContaining(testChannel));
            } catch (e) {
              await Notifications.deleteNotificationChannelAsync(testChannelId);
              await Notifications.deleteNotificationChannelGroupAsync(groupId);
              throw e;
            }
          });

          t.it('updates a channel', async () => {
            await Notifications.setNotificationChannelAsync(testChannelId, {
              name: 'Name before change',
            });
            await Notifications.setNotificationChannelAsync(testChannelId, {
              name: 'Name after change',
            });
            const channels = await Notifications.getNotificationChannelsAsync();
            t.expect(channels).toContain(
              t.jasmine.objectContaining({
                name: 'Name after change',
                id: testChannelId,
              })
            );
            t.expect(channels).not.toContain(
              t.jasmine.objectContaining({
                name: 'Name before change',
                id: testChannelId,
              })
            );
          });
        } else {
          t.it("doesn't throw an error", async () => {
            await Notifications.setNotificationChannelAsync(testChannelId, testChannel);
          });
        }
      });

      t.describe('deleteNotificationChannelAsync()', () => {
        if (Platform.OS === 'android' && Device.platformApiLevel >= 26) {
          t.it('deletes a channel', async () => {
            const preChannels = await Notifications.getNotificationChannelsAsync();
            const channelSpec = t.jasmine.objectContaining({ ...testChannel, id: testChannelId });
            t.expect(preChannels).not.toContain(channelSpec);
            await Notifications.setNotificationChannelAsync(testChannelId, testChannel);
            const postChannels = await Notifications.getNotificationChannelsAsync();
            await Notifications.deleteNotificationChannelAsync(testChannelId);
            t.expect(postChannels).toContain(channelSpec);
            t.expect(postChannels.length).toBeGreaterThan(preChannels.length);
          });
        } else {
          t.it("doesn't throw an error", async () => {
            await Notifications.deleteNotificationChannelAsync(testChannelId, testChannel);
          });
        }
      });
    });

    t.describe('Notification channel groups', () => {
      const testChannelGroupId = 'test-channel-group-id';
      const testChannelGroup = { name: 'Test channel group' };

      t.describe('getNotificationChannelGroupAsync()', () => {
        t.it('returns null if there is no such channel group', async () => {
          const channelGroup = await Notifications.getNotificationChannelGroupAsync(
            'non-existent-channel-group-id'
          );
          t.expect(channelGroup).toBe(null);
        });

        if (Platform.OS === 'android' && Device.platformApiLevel >= 26) {
          t.it('returns an object if there is such channel group', async () => {
            await Notifications.setNotificationChannelGroupAsync(
              testChannelGroupId,
              testChannelGroup
            );
            const channel = await Notifications.getNotificationChannelGroupAsync(
              testChannelGroupId
            );
            await Notifications.deleteNotificationChannelGroupAsync(testChannelGroupId);
            t.expect(channel).toBeDefined();
          });
        }
      });

      t.describe('getNotificationChannelGroupsAsync()', () => {
        if (Platform.OS === 'android' && Device.platformApiLevel >= 28) {
          t.it('returns an array', async () => {
            const channels = await Notifications.getNotificationChannelGroupsAsync();
            t.expect(channels).toEqual(t.jasmine.any(Array));
          });

          t.it('returns existing channel groups', async () => {
            const channel = await Notifications.setNotificationChannelGroupAsync(
              testChannelGroupId,
              testChannelGroup
            );
            const channels = await Notifications.getNotificationChannelGroupsAsync();
            await Notifications.deleteNotificationChannelGroupAsync(testChannelGroupId);
            t.expect(channels).toContain(channel);
          });
        } else {
          t.it("doesn't throw an error", async () => {
            await Notifications.getNotificationChannelGroupsAsync();
          });
        }
      });

      t.describe('setNotificationChannelGroupsAsync()', () => {
        t.afterEach(async () => {
          await Notifications.deleteNotificationChannelGroupAsync(testChannelGroupId);
        });

        if (Platform.OS === 'android' && Device.platformApiLevel >= 26) {
          t.it('returns the modified channel group', async () => {
            const group = await Notifications.setNotificationChannelGroupAsync(
              testChannelGroupId,
              testChannelGroup
            );
            t.expect(group).toEqual(
              t.jasmine.objectContaining({ ...testChannelGroup, id: testChannelGroupId })
            );
          });

          t.it('creates a channel group', async () => {
            const preChannelGroups = await Notifications.getNotificationChannelGroupsAsync();
            const channelGroupSpec = t.jasmine.objectContaining({
              ...testChannelGroup,
              id: testChannelGroupId,
            });
            t.expect(preChannelGroups).not.toContain(channelGroupSpec);
            await Notifications.setNotificationChannelGroupAsync(
              testChannelGroupId,
              testChannelGroup
            );
            const postChannelGroups = await Notifications.getNotificationChannelGroupsAsync();
            t.expect(postChannelGroups).toContain(channelGroupSpec);
            t.expect(postChannelGroups.length).toBeGreaterThan(preChannelGroups.length);
          });

          t.it('sets custom properties', async () => {
            const createSpec = {
              name: 'Test channel group',
              description: 'Used by `test-suite`',
            };
            const channelGroup = await Notifications.setNotificationChannelGroupAsync(
              testChannelGroupId,
              createSpec
            );
            const groupSpec = { ...createSpec, id: testChannelGroupId };
            if (Device.platformApiLevel < 28) {
              // Groups descriptions is only supported on API 28+
              delete groupSpec.description;
            }
            t.expect(channelGroup).toEqual(
              t.jasmine.objectContaining({ ...groupSpec, id: testChannelGroupId })
            );
          });

          t.it('updates a channel group', async () => {
            await Notifications.setNotificationChannelGroupAsync(testChannelGroupId, {
              name: 'Name before change',
            });
            await Notifications.setNotificationChannelGroupAsync(testChannelGroupId, {
              name: 'Name after change',
            });
            const channelGroups = await Notifications.getNotificationChannelGroupsAsync();
            t.expect(channelGroups).toContain(
              t.jasmine.objectContaining({
                name: 'Name after change',
                id: testChannelGroupId,
              })
            );
            t.expect(channelGroups).not.toContain(
              t.jasmine.objectContaining({
                name: 'Name before change',
                id: testChannelGroupId,
              })
            );
          });
        } else {
          t.it("doesn't throw an error", async () => {
            await Notifications.setNotificationChannelGroupAsync(
              testChannelGroupId,
              testChannelGroup
            );
          });
        }
      });
    });

    t.describe('Notification Categories', () => {
      const vanillaButton = {
        identifier: 'vanillaButton',
        buttonTitle: 'Plain Option',
        options: {
          isDestructive: true,
          isAuthenticationRequired: true,
          opensAppToForeground: false,
        },
      };
      const textResponseButton = {
        identifier: 'textResponseButton',
        buttonTitle: 'Click to Respond with Text',
        options: {
          isDestructive: true,
          isAuthenticationRequired: true,
          opensAppToForeground: true,
        },
        textInput: { submitButtonTitle: 'Send', placeholder: 'Type Something' },
      };

      const testCategory1 = {
        identifier: 'testNotificationCategory1',
        actions: [vanillaButton],
        options: {
          previewPlaceholder: 'preview goes here',
          customDismissAction: false,
          allowInCarPlay: false,
          showTitle: false,
          showSubtitle: false,
          allowAnnouncement: false,
        },
      };
      const testCategory2 = {
        identifier: 'testNotificationCategory2',
        actions: [vanillaButton, textResponseButton],
        options: {
          customDismissAction: false,
          allowInCarPlay: false,
          showTitle: true,
          showSubtitle: true,
          allowAnnouncement: false,
        },
      };

      const allTestCategoryIds = ['testNotificationCategory1', 'testNotificationCategory2'];

      t.describe('getNotificationCategoriesAsync()', () => {
        let existingCategoriesCount = 0;
        t.beforeAll(async () => {
          existingCategoriesCount = (await Notifications.getNotificationCategoriesAsync()).length;
        });

        t.afterEach(async () => {
          allTestCategoryIds.forEach(async (id) => {
            await Notifications.deleteNotificationCategoryAsync(id);
          });
        });

        t.it('returns an empty array if there are no categories', async () => {
          t.expect((await Notifications.getNotificationCategoriesAsync()).length).toEqual(
            existingCategoriesCount
          );
        });

        t.it('returns an array with the just-created categories', async () => {
          await Notifications.setNotificationCategoryAsync(
            testCategory1.identifier,
            testCategory1.actions,
            testCategory1.options
          );
          await Notifications.setNotificationCategoryAsync(
            testCategory2.identifier,
            testCategory2.actions,
            testCategory2.options
          );
          t.expect((await Notifications.getNotificationCategoriesAsync()).length).toEqual(
            existingCategoriesCount + 2
          );
        });
      });

      t.describe('setNotificationCategoriesAsync()', () => {
        t.afterEach(async () => {
          allTestCategoryIds.forEach(async (id) => {
            await Notifications.deleteNotificationCategoryAsync(id);
          });
        });
        t.it('creates a category with one action successfully', async () => {
          const resultCategory = await Notifications.setNotificationCategoryAsync(
            testCategory1.identifier,
            testCategory1.actions,
            testCategory1.options
          );

          t.expect(testCategory1.identifier).toEqual(resultCategory.identifier);
          testCategory1.actions.forEach((action, i) => {
            t.expect(action.identifier).toEqual(resultCategory.actions[i].identifier);
            t.expect(action.buttonTitle).toEqual(resultCategory.actions[i].buttonTitle);
            t.expect(action.options).toEqual(
              t.jasmine.objectContaining(resultCategory.actions[i].options)
            );
          });
          t.expect(testCategory1.options).toEqual(
            t.jasmine.objectContaining(resultCategory.options)
          );
        });

        t.it('creates a category with two actions successfully', async () => {
          const resultCategory = await Notifications.setNotificationCategoryAsync(
            testCategory2.identifier,
            testCategory2.actions,
            testCategory2.options
          );

          t.expect(testCategory2.identifier).toEqual(resultCategory.identifier);
          testCategory2.actions.forEach((action, i) => {
            t.expect(action.identifier).toEqual(resultCategory.actions[i].identifier);
            t.expect(action.buttonTitle).toEqual(resultCategory.actions[i].buttonTitle);
            t.expect(action.options).toEqual(
              t.jasmine.objectContaining(resultCategory.actions[i].options)
            );
          });
          t.expect(testCategory2.options).toEqual(
            t.jasmine.objectContaining(resultCategory.options)
          );
        });
      });

      t.describe('deleteNotificationCategoriesAsync()', () => {
        t.afterEach(async () => {
          allTestCategoryIds.forEach(async (id) => {
            await Notifications.deleteNotificationCategoryAsync(id);
          });
        });
        t.it('deleting a category that does not exist returns false', async () => {
          const categoriesBefore = await Notifications.getNotificationCategoriesAsync();
          t.expect(
            await Notifications.deleteNotificationCategoryAsync('nonExistentCategoryId')
          ).toBe(false);
          const categoriesAfter = await Notifications.getNotificationCategoriesAsync();
          t.expect(categoriesAfter.length).toEqual(categoriesBefore.length);
        });

        t.it('deleting a category that does exist returns true', async () => {
          await Notifications.setNotificationCategoryAsync(
            testCategory2.identifier,
            testCategory2.actions,
            testCategory2.options
          );
          t.expect(
            await Notifications.deleteNotificationCategoryAsync('testNotificationCategory2')
          ).toBe(true);
        });

        t.it('returns an array of length 1 after creating 2 categories & deleting 1', async () => {
          await Notifications.setNotificationCategoryAsync(
            testCategory1.identifier,
            testCategory1.actions,
            testCategory1.options
          );
          await Notifications.setNotificationCategoryAsync(
            testCategory2.identifier,
            testCategory2.actions,
            testCategory2.options
          );
          const categoriesBefore = await Notifications.getNotificationCategoriesAsync();
          await Notifications.deleteNotificationCategoryAsync('testNotificationCategory1');
          const categoriesAfter = await Notifications.getNotificationCategoriesAsync();
          t.expect(categoriesBefore.length - 1).toEqual(categoriesAfter.length);
        });
      });
    });

    t.describe('getBadgeCountAsync', () => {
      t.it('resolves with an integer', async () => {
        const badgeCount = await Notifications.getBadgeCountAsync();
        t.expect(typeof badgeCount).toBe('number');
      });
    });

    t.describe('setBadgeCountAsync', () => {
      t.it('resolves with a boolean', async () => {
        const randomCounter = Math.ceil(Math.random() * 9) + 1;
        const result = await Notifications.setBadgeCountAsync(randomCounter);
        t.expect(typeof result).toBe('boolean');
      });

      t.it('sets a retrievable counter (if set succeeds)', async () => {
        const randomCounter = Math.ceil(Math.random() * 9) + 1;
        if (await Notifications.setBadgeCountAsync(randomCounter)) {
          const badgeCount = await Notifications.getBadgeCountAsync();
          t.expect(badgeCount).toBe(randomCounter);
        } else {
          // TODO: add t.pending() when it starts to work
        }
      });

      t.it('clears the counter', async () => {
        const clearingCounter = 0;
        await Notifications.setBadgeCountAsync(clearingCounter);
        const badgeCount = await Notifications.getBadgeCountAsync();
        t.expect(badgeCount).toBe(clearingCounter);
      });
    });

    t.describe('getPresentedNotificationsAsync()', () => {
      const identifier = 'test-containing-id';
      const notificationStatuses = {};

      t.beforeAll(() => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
          }),
          handleSuccess: (notificationId) => {
            notificationStatuses[notificationId] = true;
          },
        });
      });

      t.it('resolves with an array containing a displayed notification', async () => {
        await Notifications.presentNotificationAsync(
          {
            title: 'Sample title',
            subtitle: 'What an event!',
            body: 'An interesting event has just happened',
            badge: 1,
          },
          identifier
        );
        await waitFor(1000);
        const displayedNotifications = await Notifications.getPresentedNotificationsAsync();
        t.expect(displayedNotifications).toContain(
          t.jasmine.objectContaining({
            request: t.jasmine.objectContaining({
              identifier,
            }),
          })
        );
      });

      t.it('resolves with an array that does not contain a canceled notification', async () => {
        await Notifications.dismissNotificationAsync(identifier);
        await waitFor(1000);
        const displayedNotifications = await Notifications.getPresentedNotificationsAsync();
        t.expect(displayedNotifications).not.toContain(
          t.jasmine.objectContaining({
            request: t.jasmine.objectContaining({
              identifier,
            }),
          })
        );
      });

      // TODO: Limited this test to Android platform only as only there we have the "Exponent notification"
      if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
        t.it('includes the foreign persistent notification', async () => {
          const displayedNotifications = await Notifications.getPresentedNotificationsAsync();
          t.expect(displayedNotifications).toContain(
            t.jasmine.objectContaining({
              request: t.jasmine.objectContaining({
                identifier: t.jasmine.stringMatching(
                  /^expo-notifications:\/\/foreign_notifications/
                ),
              }),
            })
          );
        });
      }
    });

    t.describe('dismissNotificationAsync()', () => {
      t.it('resolves for a valid notification ID', async () => {
        const identifier = 'test-id';
        await Notifications.presentNotificationAsync({
          identifier,
          title: 'Sample title',
          subtitle: 'What an event!',
          body: 'An interesting event has just happened',
          badge: 1,
        });
        await Notifications.dismissNotificationAsync(identifier);
      });

      t.it('resolves for an invalid notification ID', async () => {
        await Notifications.dismissNotificationAsync('no-such-notification-id');
      });
    });

    t.describe('dismissAllNotificationsAsync()', () => {
      t.it('resolves', async () => {
        await Notifications.dismissAllNotificationsAsync();
      });
    });

    t.describe('getAllScheduledNotificationsAsync', () => {
      const identifier = 'test-scheduled-notification';
      const notification = { title: 'Scheduled notification' };

      t.afterEach(async () => {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      });

      t.it('resolves with an Array', async () => {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        t.expect(notifications).toEqual(t.jasmine.arrayContaining([]));
      });

      t.it('contains a scheduled notification', async () => {
        const trigger = {
          seconds: 10,
        };
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: notification,
          trigger,
        });
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        t.expect(notifications).toContain(
          t.jasmine.objectContaining({
            identifier,
            content: t.jasmine.objectContaining(notification),
            trigger: t.jasmine.objectContaining({
              repeats: false,
              seconds: trigger.seconds,
              type: 'timeInterval',
            }),
          })
        );
      });

      t.it('does not contain a canceled notification', async () => {
        const trigger = {
          seconds: 10,
        };
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: notification,
          trigger,
        });
        await Notifications.cancelScheduledNotificationAsync(identifier);
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        t.expect(notifications).not.toContain(t.jasmine.objectContaining({ identifier }));
      });
    });

    t.describe('scheduleNotificationAsync', () => {
      const identifier = 'test-scheduled-notification';
      const notification = {
        title: 'Scheduled notification',
        data: { key: 'value' },
        badge: 2,
        vibrate: [100, 100, 100, 100, 100, 100],
        color: '#FF0000',
      };

      t.afterEach(async () => {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      });

      t.it(
        'triggers a notification which emits an event',
        async () => {
          const notificationReceivedSpy = t.jasmine.createSpy('notificationReceived');
          const subscription =
            Notifications.addNotificationReceivedListener(notificationReceivedSpy);
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger: { seconds: 5 },
          });
          await waitFor(6000);
          t.expect(notificationReceivedSpy).toHaveBeenCalled();
          subscription.remove();
        },
        10000
      );

      t.it(
        'throws an error if a user defines an invalid trigger (no repeats)',
        async () => {
          let error = undefined;
          try {
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: { seconds: 5, hour: 2 },
            });
          } catch (err) {
            error = err;
          }
          t.expect(error).toBeDefined();
        },
        10000
      );

      t.it(
        'throws an error if a user defines an invalid trigger (with repeats)',
        async () => {
          let error = undefined;
          try {
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: { seconds: 5, repeats: true, hour: 2 },
            });
          } catch (err) {
            error = err;
          }
          t.expect(error).toBeDefined();
        },
        10000
      );

      t.it(
        'triggers a notification which contains the custom color',
        async () => {
          const notificationReceivedSpy = t.jasmine.createSpy('notificationReceived');
          const subscription =
            Notifications.addNotificationReceivedListener(notificationReceivedSpy);
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger: { seconds: 5 },
          });
          await waitFor(6000);
          t.expect(notificationReceivedSpy).toHaveBeenCalled();
          if (Platform.OS === 'android') {
            t.expect(notificationReceivedSpy).toHaveBeenCalledWith(
              t.jasmine.objectContaining({
                request: t.jasmine.objectContaining({
                  content: t.jasmine.objectContaining({
                    // #AARRGGBB
                    color: '#FFFF0000',
                  }),
                }),
              })
            );
          }
          subscription.remove();
        },
        10000
      );

      t.it(
        'triggers a notification which triggers the handler (`seconds` trigger)',
        async () => {
          let notificationFromEvent = undefined;
          Notifications.setNotificationHandler({
            handleNotification: async (event) => {
              notificationFromEvent = event;
              return {
                shouldShowAlert: true,
              };
            },
          });
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger: { seconds: 5 },
          });
          await waitFor(6000);
          t.expect(notificationFromEvent).toBeDefined();
          Notifications.setNotificationHandler(null);
        },
        10000
      );

      t.it(
        'triggers a notification which triggers the handler (with custom sound)',
        async () => {
          let notificationFromEvent = undefined;
          Notifications.setNotificationHandler({
            handleNotification: async (event) => {
              notificationFromEvent = event;
              return {
                shouldShowAlert: true,
                shouldPlaySound: true,
              };
            },
          });
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              ...notification,
              sound: 'notification.wav',
            },
            trigger: { seconds: 5 },
          });
          await waitFor(6000);
          t.expect(notificationFromEvent).toBeDefined();
          t.expect(notificationFromEvent).toEqual(
            t.jasmine.objectContaining({
              request: t.jasmine.objectContaining({
                content: t.jasmine.objectContaining({
                  sound: 'custom',
                }),
              }),
            })
          );
          Notifications.setNotificationHandler(null);
        },
        10000
      );

      t.it(
        'triggers a notification which triggers the handler (with custom sound set, but not existent)',
        async () => {
          let notificationFromEvent = undefined;
          Notifications.setNotificationHandler({
            handleNotification: async (event) => {
              notificationFromEvent = event;
              return {
                shouldShowAlert: true,
                shouldPlaySound: true,
              };
            },
          });
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              ...notification,
              sound: 'no-such-file.wav',
            },
            trigger: { seconds: 5 },
          });
          await waitFor(6000);
          t.expect(notificationFromEvent).toBeDefined();
          t.expect(notificationFromEvent).toEqual(
            t.jasmine.objectContaining({
              request: t.jasmine.objectContaining({
                content: t.jasmine.objectContaining({
                  sound: 'custom',
                }),
              }),
            })
          );
          Notifications.setNotificationHandler(null);
        },
        10000
      );

      t.it(
        'triggers a notification which triggers the handler (`Date` trigger)',
        async () => {
          let notificationFromEvent = undefined;
          Notifications.setNotificationHandler({
            handleNotification: async (event) => {
              notificationFromEvent = event;
              return {
                shouldShowAlert: true,
              };
            },
          });
          const trigger = new Date(Date.now() + 5 * 1000);
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger,
          });
          await waitFor(6000);
          t.expect(notificationFromEvent).toBeDefined();
          Notifications.setNotificationHandler(null);
        },
        10000
      );

      t.it(
        'schedules a repeating daily notification; only first scheduled event is verified.',
        async () => {
          const dateNow = new Date();
          const trigger = {
            hour: dateNow.getHours(),
            minute: (dateNow.getMinutes() + 2) % 60,
            repeats: true,
          };
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger,
          });
          const result = await Notifications.getAllScheduledNotificationsAsync();
          delete trigger.repeats;
          if (Platform.OS === 'android') {
            t.expect(result[0].trigger).toEqual({
              type: 'daily',
              channelId: null,
              ...trigger,
            });
          } else if (Platform.OS === 'ios') {
            t.expect(result[0].trigger).toEqual({
              type: 'calendar',
              class: 'UNCalendarNotificationTrigger',
              repeats: true,
              dateComponents: {
                ...trigger,
                timeZone: null,
                isLeapMonth: false,
                calendar: null,
              },
            });
          } else {
            throw new Error('Test does not support platform');
          }
        },
        4000
      );

      t.it(
        'schedules a repeating weekly notification; only first scheduled event is verified.',
        async () => {
          const dateNow = new Date();
          const trigger = {
            // JS weekday range equals 0 to 6, Sunday equals 0
            // Native weekday range equals 1 to 7, Sunday equals 1
            weekday: dateNow.getDay() + 1,
            hour: dateNow.getHours(),
            minute: (dateNow.getMinutes() + 2) % 60,
            repeats: true,
          };
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger,
          });
          const result = await Notifications.getAllScheduledNotificationsAsync();
          delete trigger.repeats;
          if (Platform.OS === 'android') {
            t.expect(result[0].trigger).toEqual({
              type: 'weekly',
              channelId: null,
              ...trigger,
            });
          } else if (Platform.OS === 'ios') {
            t.expect(result[0].trigger).toEqual({
              type: 'calendar',
              class: 'UNCalendarNotificationTrigger',
              repeats: true,
              dateComponents: {
                ...trigger,
                timeZone: null,
                isLeapMonth: false,
                calendar: null,
              },
            });
          } else {
            throw new Error('Test does not support platform');
          }
        },
        4000
      );

      t.it(
        'schedules a repeating yearly notification; only first scheduled event is verified.',
        async () => {
          const dateNow = new Date();
          const trigger = {
            day: dateNow.getDate(),
            month: dateNow.getMonth(),
            hour: dateNow.getHours(),
            minute: (dateNow.getMinutes() + 2) % 60,
            repeats: true,
          };
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger,
          });
          const result = await Notifications.getAllScheduledNotificationsAsync();
          delete trigger.repeats;
          if (Platform.OS === 'android') {
            t.expect(result[0].trigger).toEqual({
              type: 'yearly',
              channelId: null,
              ...trigger,
            });
          } else if (Platform.OS === 'ios') {
            t.expect(result[0].trigger).toEqual({
              type: 'calendar',
              class: 'UNCalendarNotificationTrigger',
              repeats: true,
              dateComponents: {
                ...trigger,
                // iOS uses 1-12 based months
                month: trigger.month + 1,
                timeZone: null,
                isLeapMonth: false,
                calendar: null,
              },
            });
          } else {
            throw new Error('Test does not support platform');
          }
        },
        4000
      );

      // iOS rejects with "time interval must be at least 60 if repeating"
      // and having a test running for more than 60 seconds may be too
      // time-consuming to maintain
      if (Platform.OS !== 'ios') {
        t.it(
          'triggers a repeating notification which emits events',
          async () => {
            let timesSpyHasBeenCalled = 0;
            const subscription = Notifications.addNotificationReceivedListener(() => {
              timesSpyHasBeenCalled += 1;
            });
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: {
                seconds: 5,
                repeats: true,
              },
            });
            await waitFor(12000);
            t.expect(timesSpyHasBeenCalled).toBeGreaterThan(1);
            subscription.remove();
          },
          16000
        );
      }

      if (Platform.OS === 'ios') {
        t.it(
          'schedules a notification with calendar trigger',
          async () => {
            const notificationReceivedSpy = t.jasmine.createSpy('notificationReceived');
            const subscription =
              Notifications.addNotificationReceivedListener(notificationReceivedSpy);
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: {
                second: (new Date().getSeconds() + 5) % 60,
              },
            });
            await waitFor(6000);
            t.expect(notificationReceivedSpy).toHaveBeenCalled();
            subscription.remove();
          },
          16000
        );
      }
    });

    t.describe('getNextTriggerDateAsync', () => {
      if (Platform.OS === 'ios') {
        t.it('generates trigger date for a calendar trigger', async () => {
          const nextDate = await Notifications.getNextTriggerDateAsync({ month: 1, hour: 9 });
          t.expect(nextDate).not.toBeNull();
        });
      } else {
        t.it('fails to generate trigger date for a calendar trigger', async () => {
          let exception = null;
          try {
            await Notifications.getNextTriggerDateAsync({ month: 1, hour: 9, repeats: true });
          } catch (e) {
            exception = e;
          }
          t.expect(exception).toBeDefined();
        });
      }

      t.it('generates trigger date for a daily trigger', async () => {
        const nextDate = await Notifications.getNextTriggerDateAsync({
          hour: 9,
          minute: 20,
          repeats: true,
        });
        t.expect(nextDate).not.toBeNull();
        t.expect(new Date(nextDate).getHours()).toBe(9);
        t.expect(new Date(nextDate).getMinutes()).toBe(20);
      });

      t.it('generates trigger date for a weekly trigger', async () => {
        const nextDateTimestamp = await Notifications.getNextTriggerDateAsync({
          weekday: 2,
          hour: 9,
          minute: 20,
          repeats: true,
        });
        t.expect(nextDateTimestamp).not.toBeNull();
        const nextDate = new Date(nextDateTimestamp);
        // JS has 0 (Sunday) - 6 (Saturday) based week days
        t.expect(nextDate.getDay()).toBe(1);
        t.expect(nextDate.getHours()).toBe(9);
        t.expect(nextDate.getMinutes()).toBe(20);
      });

      t.it('generates trigger date for a yearly trigger', async () => {
        const nextDateTimestamp = await Notifications.getNextTriggerDateAsync({
          day: 2,
          month: 6,
          hour: 9,
          minute: 20,
          repeats: true,
        });
        t.expect(nextDateTimestamp).not.toBeNull();
        const nextDate = new Date(nextDateTimestamp);
        t.expect(nextDate.getDate()).toBe(2);
        t.expect(nextDate.getMonth()).toBe(6);
        t.expect(nextDate.getHours()).toBe(9);
        t.expect(nextDate.getMinutes()).toBe(20);
      });

      t.it('fails to generate trigger date for the immediate trigger', async () => {
        let exception = null;
        try {
          await Notifications.getNextTriggerDateAsync({ channelId: 'test-channel-id' });
        } catch (e) {
          exception = e;
        }
        t.expect(exception).toBeDefined();
      });
    });

    t.describe('cancelScheduledNotificationAsync', () => {
      const identifier = 'test-scheduled-canceled-notification';
      const notification = { title: 'Scheduled, canceled notification' };

      t.it(
        'makes a scheduled notification not trigger',
        async () => {
          const notificationReceivedSpy = t.jasmine.createSpy('notificationReceived');
          const subscription =
            Notifications.addNotificationReceivedListener(notificationReceivedSpy);
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: notification,
            trigger: { seconds: 5 },
          });
          await Notifications.cancelScheduledNotificationAsync(identifier);
          await waitFor(6000);
          t.expect(notificationReceivedSpy).not.toHaveBeenCalled();
          subscription.remove();
        },
        10000
      );
    });

    t.describe('cancelAllScheduledNotificationsAsync', () => {
      const notification = { title: 'Scheduled, canceled notification' };

      t.it(
        'removes all scheduled notifications',
        async () => {
          const notificationReceivedSpy = t.jasmine.createSpy('notificationReceived');
          const subscription =
            Notifications.addNotificationReceivedListener(notificationReceivedSpy);
          for (let i = 0; i < 3; i += 1) {
            await Notifications.scheduleNotificationAsync({
              identifier: `notification-${i}`,
              content: notification,
              trigger: { seconds: 5 },
            });
          }
          await Notifications.cancelAllScheduledNotificationsAsync();
          await waitFor(6000);
          t.expect(notificationReceivedSpy).not.toHaveBeenCalled();
          subscription.remove();
          const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
          t.expect(scheduledNotifications.length).toEqual(0);
        },
        10000
      );
    });

    const onlyInteractiveDescribe = isInteractive ? t.describe : t.xdescribe;
    onlyInteractiveDescribe('when the app is in background', () => {
      let subscription = null;
      let handleNotificationSpy = null;
      let handleSuccessSpy = null;
      let handleErrorSpy = null;
      let notificationReceivedSpy = null;

      t.beforeEach(async () => {
        handleNotificationSpy = t.jasmine.createSpy('handleNotificationSpy');
        handleSuccessSpy = t.jasmine.createSpy('handleSuccessSpy');
        handleErrorSpy = t.jasmine.createSpy('handleErrorSpy').and.callFake((...args) => {
          console.log(args);
        });
        notificationReceivedSpy = t.jasmine.createSpy('notificationReceivedSpy');
        Notifications.setNotificationHandler({
          handleNotification: handleNotificationSpy,
          handleSuccess: handleSuccessSpy,
          handleError: handleErrorSpy,
        });
        subscription = Notifications.addNotificationReceivedListener(notificationReceivedSpy);
      });

      t.afterEach(() => {
        if (subscription) {
          subscription.remove();
          subscription = null;
        }
        Notifications.setNotificationHandler(null);
        handleNotificationSpy = null;
        handleSuccessSpy = null;
        handleErrorSpy = null;
        notificationReceivedSpy = null;
      });

      t.it(
        'shows the notification',
        // without async-await the code is executed immediately after opening the screen
        async () =>
          await new Promise((resolve, reject) => {
            const secondsToTimeout = 5;
            let notificationSent = false;
            Alert.alert(`Please move the app to the background and wait for 5 seconds`);
            let userInteractionTimeout = null;
            async function handleStateChange(state) {
              const identifier = 'test-interactive-notification';
              if (state === 'background' && !notificationSent) {
                if (userInteractionTimeout) {
                  clearInterval(userInteractionTimeout);
                  userInteractionTimeout = null;
                }
                await Notifications.scheduleNotificationAsync({
                  identifier,
                  content: {
                    title: 'Hello from the application!',
                    message:
                      'You can now return to the app and let the test know the notification has been shown.',
                  },
                  trigger: { seconds: 1 },
                });
                notificationSent = true;
              } else if (state === 'active' && notificationSent) {
                const notificationWasShown = await askUserYesOrNo('Was the notification shown?');
                t.expect(notificationWasShown).toBeTruthy();
                t.expect(handleNotificationSpy).not.toHaveBeenCalled();
                t.expect(handleSuccessSpy).not.toHaveBeenCalled();
                t.expect(handleErrorSpy).not.toHaveBeenCalledWith(identifier);
                t.expect(notificationReceivedSpy).not.toHaveBeenCalled();
                AppState.removeEventListener('change', handleStateChange);
                resolve();
              }
            }
            userInteractionTimeout = setTimeout(() => {
              console.warn(
                "Scheduled notification test was skipped and marked as successful. It required user interaction which hasn't occured in time."
              );
              AppState.removeEventListener('change', handleStateChange);
              Alert.alert(
                'Scheduled notification test was skipped',
                `The test required user interaction which hasn't occurred in time (${secondsToTimeout} seconds). It has been marked as passing. Better luck next time!`
              );
              resolve();
            }, secondsToTimeout * 1000);
            AppState.addEventListener('change', handleStateChange);
          }),
        30000
      );
    });

    onlyInteractiveDescribe('tapping on a notification', () => {
      let subscription = null;
      let event = null;

      t.beforeEach(async () => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
          }),
        });
        subscription = Notifications.addNotificationResponseReceivedListener((anEvent) => {
          event = anEvent;
        });
      });

      t.afterEach(() => {
        if (subscription) {
          subscription.remove();
          subscription = null;
        }
        Notifications.setNotificationHandler(null);
        event = null;
      });

      t.it(
        'calls the “notification response received” listener with default action identifier',
        async () => {
          const secondsToTimeout = 5;
          const shouldRun = await Promise.race([
            askUserYesOrNo('Could you tap on a notification when it shows?'),
            waitFor(secondsToTimeout * 1000),
          ]);
          if (!shouldRun) {
            console.warn(
              "Notification response test was skipped and marked as successful. It required user interaction which hasn't occured in time."
            );
            Alert.alert(
              'Notification response test was skipped',
              `The test required user interaction which hasn't occurred in time (${secondsToTimeout} seconds). It has been marked as passing. Better luck next time!`
            );
            return;
          }
          const notificationSpec = {
            title: 'Tap me!',
            body: 'Better be quick!',
          };
          await Notifications.presentNotificationAsync(notificationSpec);
          let iterations = 0;
          while (iterations < 5) {
            iterations += 1;
            if (event) {
              break;
            }
            await waitFor(1000);
          }
          t.expect(event).not.toBeNull();
          t.expect(event.actionIdentifier).toBe(Notifications.DEFAULT_ACTION_IDENTIFIER);
          t.expect(event.notification).toEqual(
            t.jasmine.objectContaining({
              request: t.jasmine.objectContaining({
                content: t.jasmine.objectContaining(notificationSpec),
              }),
            })
          );
          t.expect(event).toEqual(await Notifications.getLastNotificationResponseAsync());
        },
        10000
      );
    });

    onlyInteractiveDescribe(
      'triggers a repeating daily notification. only first scheduled event is awaited and verified.',
      () => {
        let timesSpyHasBeenCalled = 0;
        const identifier = 'test-scheduled-notification';
        const notification = {
          title: 'Scheduled notification',
          data: { key: 'value' },
          badge: 2,
          vibrate: [100, 100, 100, 100, 100, 100],
          color: '#FF0000',
        };

        t.beforeEach(async () => {
          await Notifications.cancelAllScheduledNotificationsAsync();
          Notifications.setNotificationHandler({
            handleNotification: async () => {
              timesSpyHasBeenCalled += 1;
              return {
                shouldShowAlert: false,
              };
            },
          });
        });

        t.afterEach(async () => {
          Notifications.setNotificationHandler(null);
          await Notifications.cancelAllScheduledNotificationsAsync();
        });

        t.it(
          'triggers a repeating daily notification. only first event is verified.',
          async () => {
            // On iOS because we are using the calendar with repeat, it needs to be
            // greater than 60 seconds
            const triggerDate = new Date(
              new Date().getTime() + (Platform.OS === 'ios' ? 120000 : 60000)
            );
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: {
                hour: triggerDate.getHours(),
                minute: triggerDate.getMinutes(),
                repeats: true,
              },
            });
            const scheduledTime = new Date(triggerDate);
            scheduledTime.setSeconds(0);
            scheduledTime.setMilliseconds(0);
            const milliSecondsToWait = scheduledTime - new Date().getTime() + 2000;
            await waitFor(milliSecondsToWait);
            t.expect(timesSpyHasBeenCalled).toBe(1);
          },
          140000
        );
      }
    );

    onlyInteractiveDescribe(
      'triggers a repeating weekly notification. only first scheduled event is awaited and verified.',
      () => {
        let timesSpyHasBeenCalled = 0;
        const identifier = 'test-scheduled-notification';
        const notification = {
          title: 'Scheduled notification',
          data: { key: 'value' },
          badge: 2,
          vibrate: [100, 100, 100, 100, 100, 100],
          color: '#FF0000',
        };

        t.beforeEach(async () => {
          await Notifications.cancelAllScheduledNotificationsAsync();
          Notifications.setNotificationHandler({
            handleNotification: async () => {
              timesSpyHasBeenCalled += 1;
              return {
                shouldShowAlert: false,
              };
            },
          });
        });

        t.afterEach(async () => {
          Notifications.setNotificationHandler(null);
          await Notifications.cancelAllScheduledNotificationsAsync();
        });

        t.it(
          'triggers a repeating weekly notification. only first event is verified.',
          async () => {
            // On iOS because we are using the calendar with repeat, it needs to be
            // greater than 60 seconds
            const triggerDate = new Date(
              new Date().getTime() + (Platform.OS === 'ios' ? 120000 : 60000)
            );
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: {
                // JS weekday range equals 0 to 6, Sunday equals 0
                // Native weekday range equals 1 to 7, Sunday equals 1
                weekday: triggerDate.getDay() + 1,
                hour: triggerDate.getHours(),
                minute: triggerDate.getMinutes(),
                repeats: true,
              },
            });
            const scheduledTime = new Date(triggerDate);
            scheduledTime.setSeconds(0);
            scheduledTime.setMilliseconds(0);
            const milliSecondsToWait = scheduledTime - new Date().getTime() + 2000;
            await waitFor(milliSecondsToWait);
            t.expect(timesSpyHasBeenCalled).toBe(1);
          },
          140000
        );
      }
    );

    onlyInteractiveDescribe(
      'triggers a repeating yearly notification. only first scheduled event is awaited and verified.',
      () => {
        let timesSpyHasBeenCalled = 0;
        const identifier = 'test-scheduled-notification';
        const notification = {
          title: 'Scheduled notification',
          data: { key: 'value' },
          badge: 2,
          vibrate: [100, 100, 100, 100, 100, 100],
          color: '#FF0000',
        };

        t.beforeEach(async () => {
          await Notifications.cancelAllScheduledNotificationsAsync();
          Notifications.setNotificationHandler({
            handleNotification: async () => {
              timesSpyHasBeenCalled += 1;
              return {
                shouldShowAlert: false,
              };
            },
          });
        });

        t.afterEach(async () => {
          Notifications.setNotificationHandler(null);
          await Notifications.cancelAllScheduledNotificationsAsync();
        });

        t.it(
          'triggers a repeating yearly notification. only first event is verified.',
          async () => {
            // On iOS because we are using the calendar with repeat, it needs to be
            // greater than 60 seconds
            const triggerDate = new Date(
              new Date().getTime() + (Platform.OS === 'ios' ? 120000 : 60000)
            );
            await Notifications.scheduleNotificationAsync({
              identifier,
              content: notification,
              trigger: {
                day: triggerDate.getDate(),
                month: triggerDate.getMonth(),
                hour: triggerDate.getHours(),
                minute: triggerDate.getMinutes(),
                repeats: true,
              },
            });
            const scheduledTime = new Date(triggerDate);
            scheduledTime.setSeconds(0);
            scheduledTime.setMilliseconds(0);
            const milliSecondsToWait = scheduledTime - new Date().getTime() + 2000;
            await waitFor(milliSecondsToWait);
            t.expect(timesSpyHasBeenCalled).toBe(1);
          },
          140000
        );
      }
    );
  });
}

// In this test app we contact the Expo push service directly. You *never*
// should do this in a real app. You should always store the push tokens on your
// own server or use the local notification API if you want to notify this user.
const PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

async function sendTestPushNotification(expoPushToken, notificationOverrides) {
  // POST the token to the Expo push server
  const response = await fetch(PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      // No specific channel ID forces the package to create a fallback channel
      // to present the notification on newer Android devices. One of the tests
      // ensures that the fallback channel is created.
      {
        to: expoPushToken,
        title: 'Hello from Expo server!',
        data: {
          fieldTestedInDataContentsTest: 42, // <- it's true, do not remove it
          firstLevelString: 'value',
          firstLevelObject: {
            secondLevelInteger: 2137,
            secondLevelObject: {
              thirdLevelList: [21, 3, 1995, null, 4, 15],
              thirdLevelNull: null,
            },
          },
        },
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

function askUserYesOrNo(title, message = '') {
  return new Promise((resolve, reject) => {
    try {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'No',
            onPress: () => resolve(false),
          },
          {
            text: 'Yes',
            onPress: () => resolve(true),
          },
        ],
        { onDismiss: () => resolve(false) }
      );
    } catch (e) {
      reject(e);
    }
  });
}
