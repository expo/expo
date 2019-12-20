import { CodedError, Platform } from '@unimodules/core';
import Constants from 'expo-constants';

import { DevicePushToken } from './getDevicePushTokenAsync';

export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  const data = await _subscribeUserToPushAsync();
  return { type: Platform.OS, data };
}

function guardPermission() {
  if (!('Notification' in window)) {
    throw new Error('The Notification API is not available on this device.');
  }
  if (!navigator.serviceWorker) {
    throw new Error(
      'Notifications cannot be used because the service worker API is not supported on this device. This might also happen because your web page does not support HTTPS.'
    );
  }
  if (Notification.permission !== 'granted') {
    throw new Error(
      'Cannot use Notifications without permissions. Please request permissions with `expo-permissions`'
    );
  }
}

async function _subscribeUserToPushAsync(): Promise<DevicePushToken['data']> {
  if (!Constants.manifest.notification || !Constants.manifest.notification.vapidPublicKey) {
    throw new CodedError(
      'E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG',
      'You must provide `notification.vapidPublicKey` in `app.json` to use push notifications on web. Learn more: https://docs.expo.io/versions/latest/guides/using-vapid/.'
    );
  }
  if (!Constants.manifest.notification || !Constants.manifest.notification.serviceWorkerPath) {
    throw new CodedError(
      'E_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG',
      'You must provide `notification.serviceWorkerPath` in `app.json` to use push notifications on web. Please provide path to the service worker that will handle notifications.'
    );
  }
  guardPermission();

  const registration = await navigator.serviceWorker.register(Constants.manifest.notification.serviceWorkerPath);
  await navigator.serviceWorker.ready;

  if (!registration.active) {
    throw new Error(
      'Notifications might not be working because the service worker API is not active.'
    );
  }

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: _urlBase64ToUint8Array(Constants.manifest.notification.vapidPublicKey),
  };
  const pushSubscription = await registration.pushManager
    .subscribe(subscribeOptions)
    .catch(error => {
      throw new CodedError(
        'E_NOTIFICATIONS_PUSH_WEB_TOKEN_REGISTRATION_FAILED',
        'The device was unable to register for remote notifications with the browser endpoint. (' +
          error +
          ')'
      );
    });
  const pushSubscriptionJson = pushSubscription.toJSON();

  const subscriptionObject = {
    endpoint: pushSubscriptionJson.endpoint,
    keys: {
      p256dh: pushSubscriptionJson.keys!.p256dh,
      auth: pushSubscriptionJson.keys!.auth,
    },
  };

  // Store notification icon string in service worker.
  // This message is received by `/expo-service-worker.js`.
  // We wrap it with `fromExpoWebClient` to make sure other message
  // will not override content such as `notificationIcon`.
  // https://stackoverflow.com/a/35729334/2603230
  let notificationIcon = (Constants.manifest.notification || {}).icon;
  await registration.active.postMessage(
    JSON.stringify({ fromExpoWebClient: { notificationIcon } })
  );

  return subscriptionObject;
}

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
