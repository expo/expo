import { CodedError } from '@unimodules/core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import UUID from 'uuid-js';
// Register `message`'s event listener (side-effect)
import './ExponentNotifications.fx.web';
function guardPermission() {
    if (!('Notification' in window)) {
        throw new Error('The Notification API is not available on this device.');
    }
    if (!navigator.serviceWorker) {
        throw new Error('Notifications cannot be used because the service worker API is not supported on this device. This might also happen because your web page does not support HTTPS.');
    }
    if (Notification.permission !== 'granted') {
        throw new Error('Cannot use Notifications without permissions. Please request permissions with `expo-permissions`');
    }
}
function transformLocalNotification(notification, tag) {
    const { web = {}, ...abstractNotification } = notification;
    tag = web.tag || tag;
    const nativeNotification = {
        ...abstractNotification,
        tag,
        ...web,
        // Show that this notification is a local notification
        _isLocal: true,
    };
    return [nativeNotification.title, nativeNotification];
}
function generateID() {
    return UUID.create().toString();
}
async function getRegistrationAsync() {
    guardPermission();
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
        throw new Error('Failed to get notification registration!');
    }
    return registration;
}
async function getNotificationsAsync(tag) {
    const registration = await getRegistrationAsync();
    const notifications = await registration.getNotifications(tag ? { tag } : undefined);
    return notifications;
}
export default {
    async presentLocalNotification(notification) {
        const registration = await getRegistrationAsync();
        const tag = generateID();
        registration.showNotification(...transformLocalNotification(notification, tag));
        return tag;
    },
    async scheduleLocalNotification(notification, options = {}) {
        if (options.intervalMs) {
            const registration = await getRegistrationAsync();
            const tag = generateID();
            setTimeout(() => {
                registration.showNotification(...transformLocalNotification(notification, tag));
            }, options.intervalMs);
            return tag;
        }
        else if (options.time) {
            const intervalMs = options.time - Date.now();
            if (intervalMs < 0) {
                throw new Error('Expo.Notifications.scheduleLocalNotification(): options.time must be some time in the future.');
            }
            return this.scheduleLocalNotification(notification, {
                intervalMs,
            });
        }
        throw new Error(`Expo.Notifications.scheduleLocalNotification() options ${JSON.stringify(options, null, 2)} are not supported yet.`);
    },
    async dismissNotification(notificationId) {
        const notifications = await getNotificationsAsync(notificationId);
        for (const notification of notifications) {
            notification.close();
        }
    },
    async dismissAllNotifications() {
        this.dismissNotification();
    },
    async cancelScheduledNotificationAsync(notificationId) {
        this.dismissNotification(notificationId);
    },
    async cancelAllScheduledNotificationsAsync() {
        this.dismissNotification();
    },
    async getExponentPushTokenAsync() {
        if (!Constants.manifest.owner || !Constants.manifest.slug) {
            throw new CodedError('E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG', 'You must provide `owner` and `slug` in `app.json` to use push notifications on web. Learn more: https://docs.expo.io/versions/latest/guides/using-vapid/.');
        }
        const data = await _subscribeUserToPushAsync();
        const experienceId = `@${Constants.manifest.owner}/${Constants.manifest.slug}`;
        const tokenArguments = {
            deviceId: Constants.installationId,
            experienceId: experienceId,
            // Also uses `experienceId` for `appId` because there's no `appId` for web.
            appId: experienceId,
            deviceToken: JSON.stringify(data),
            type: 'web',
        };
        // TODO: Use production URL
        const response = await fetch('http://expo.test/--/api/v2/push/getExpoPushToken', {
            method: 'POST',
            body: JSON.stringify(tokenArguments),
        })
            .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response;
        })
            .then(response => response.json())
            .catch(error => {
            throw new CodedError('E_NOTIFICATIONS_TOKEN_REGISTRATION_FAILED', 'The device was unable to register for remote notifications with Expo. (' + error + ')');
        });
        return response.data.expoPushToken;
    },
    async getDevicePushTokenAsync() {
        const data = await _subscribeUserToPushAsync();
        return { type: Platform.OS, data: data };
    },
};
async function _subscribeUserToPushAsync() {
    if (!Constants.manifest.notification || !Constants.manifest.notification.vapidPublicKey) {
        throw new CodedError('E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG', 'You must provide `notification.vapidPublicKey` in `app.json` to use push notifications on web. Learn more: https://docs.expo.io/versions/latest/guides/using-vapid/.');
    }
    guardPermission();
    const registration = await navigator.serviceWorker.register('/expo-service-worker.js');
    if (!registration.active) {
        throw new Error('Notifications might not be working because the service worker API is not active.');
    }
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(Constants.manifest.notification.vapidPublicKey),
    };
    const pushSubscription = await registration.pushManager
        .subscribe(subscribeOptions)
        .catch(error => {
        throw new CodedError('E_NOTIFICATIONS_PUSH_WEB_TOKEN_REGISTRATION_FAILED', 'The device was unable to register for remote notifications with the browser endpoint. (' +
            error +
            ')');
    });
    const pushSubscriptionJson = pushSubscription.toJSON();
    const subscriptionObject = {
        endpoint: pushSubscriptionJson.endpoint,
        keys: {
            p256dh: pushSubscriptionJson.keys.p256dh,
            auth: pushSubscriptionJson.keys.auth,
        },
    };
    // Store notification icon string in service worker.
    // This message is received by `/expo-service-worker.js`.
    // https://stackoverflow.com/a/35729334/2603230
    let notificationIcon = (Constants.manifest.notification || {}).icon;
    registration.active.postMessage(JSON.stringify({ notificationIcon }));
    return subscriptionObject;
}
// https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
function _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
//# sourceMappingURL=ExponentNotifications.web.js.map