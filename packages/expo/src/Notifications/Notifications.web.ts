import { CodedError } from '@unimodules/core';
import Constants from 'expo-constants';
import { EmitterSubscription } from 'react-native';
import { _notificationEmitter, _notificationEmitterEventName } from './Notifications.fx.web';
import { Notification } from './NotificationsTypes';

export default {
  async getExpoPushTokenAsync(): Promise<string> {
    if (!Constants.manifest.owner || !Constants.manifest.slug) {
      throw new CodedError(
        'ERR_WEB_PUSH_NOTIFICATIONS_MISSING_CONFIG',
        'You must provide `owner` and `slug` in `app.json` to use push notifications on web. Read more here: https://docs.expo.io/versions/latest/guides/using-vapid/.'
      );
    }

    const data = await this.subscribeUserToPushAsync();
    const experienceId = `@${Constants.manifest.owner}/${Constants.manifest.slug}`;
    const tokenArguments: { [key: string]: string } = {
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
    }).then(response => response.json());

    // TODO: Error handling
    return response.data.expoPushToken;
  },

  async getDevicePushTokenAsync(): Promise<{ type: string; data: Object }> {
    const data = await this.subscribeUserToPushAsync();
    return { type: 'web', data: data };
  },

  async subscribeUserToPushAsync(): Promise<Object> {
    if (!Constants.manifest.notification || !Constants.manifest.notification.vapidPublicKey) {
      throw new CodedError(
        'ERR_WEB_PUSH_NOTIFICATIONS_MISSING_CONFIG',
        'You must provide `notification.vapidPublicKey` in `app.json` to use push notifications on web. Read more here: https://docs.expo.io/versions/latest/guides/using-vapid/.'
      );
    }

    const registration = await navigator.serviceWorker.register('/service-worker.js');
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: _urlBase64ToUint8Array(Constants.manifest.notification.vapidPublicKey),
    };
    const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
    const pushSubscriptionJson = pushSubscription.toJSON();

    const subscriptionObject = {
      endpoint: pushSubscriptionJson.endpoint,
      keys: {
        p256dh: pushSubscriptionJson.keys!.p256dh,
        auth: pushSubscriptionJson.keys!.auth,
      },
    };
    console.log('subscriptionObject: ', JSON.stringify(subscriptionObject));
    return subscriptionObject;
  },

  addListener(listener: (notification: Notification) => unknown): EmitterSubscription {
    return _notificationEmitter.addListener(_notificationEmitterEventName, listener);
  },
};

// https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
function _urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
