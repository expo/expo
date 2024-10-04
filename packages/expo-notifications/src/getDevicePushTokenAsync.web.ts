import Constants from 'expo-constants';
import { CodedError, Platform, SyntheticPlatformEmitter } from 'expo-modules-core';

import { DevicePushToken } from './Tokens.types';

export default async function getDevicePushTokenAsync(): Promise<DevicePushToken> {
  const data = await _subscribeDeviceToPushNotificationsAsync();
  SyntheticPlatformEmitter.emit('onDevicePushToken', { devicePushToken: data });
  return { type: Platform.OS, data };
}

function guardPermission() {
  if (!('Notification' in window)) {
    throw new CodedError(
      'ERR_UNAVAILABLE',
      'The Web Notifications API is not available on this device.'
    );
  }
  if (!navigator.serviceWorker) {
    throw new CodedError(
      'ERR_UNAVAILABLE',
      'Notifications cannot be used because the service worker API is not supported on this device. This might also happen because your web page does not support HTTPS.'
    );
  }
  if (Notification.permission !== 'granted') {
    throw new CodedError(
      'ERR_NOTIFICATIONS_PERMISSION_DENIED',
      `Cannot use web notifications without permissions granted. Request permissions with "expo-permissions".`
    );
  }
}

async function _subscribeDeviceToPushNotificationsAsync(): Promise<DevicePushToken['data']> {
  // @ts-expect-error: TODO: not on the schema
  const vapidPublicKey: string | null = Constants.expoConfig?.notification?.vapidPublicKey;
  if (!vapidPublicKey) {
    throw new CodedError(
      'ERR_NOTIFICATIONS_PUSH_WEB_MISSING_CONFIG',
      'You must provide `notification.vapidPublicKey` in `app.json` to use push notifications on web. Learn more: https://docs.expo.dev/versions/latest/guides/using-vapid/.'
    );
  }

  // @ts-expect-error: TODO: not on the schema
  const serviceWorkerPath = Constants.expoConfig?.notification?.serviceWorkerPath;
  if (!serviceWorkerPath) {
    throw new CodedError(
      'ERR_NOTIFICATIONS_PUSH_MISSING_CONFIGURATION',
      'You must specify `notification.serviceWorkerPath` in `app.json` to use push notifications on the web. Please provide the path to the service worker that will handle notifications.'
    );
  }
  guardPermission();

  let registration: ServiceWorkerRegistration | null = null;
  try {
    registration = await navigator.serviceWorker.register(serviceWorkerPath);
  } catch (error) {
    throw new CodedError(
      'ERR_NOTIFICATIONS_PUSH_REGISTRATION_FAILED',
      `Could not register this device for push notifications because the service worker (${serviceWorkerPath}) could not be registered: ${error}`
    );
  }
  await navigator.serviceWorker.ready;

  if (!registration.active) {
    throw new CodedError(
      'ERR_NOTIFICATIONS_PUSH_REGISTRATION_FAILED',
      'Could not register this device for push notifications because the service worker is not active.'
    );
  }

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: _urlBase64ToUint8Array(vapidPublicKey),
  };
  let pushSubscription: PushSubscription | null = null;
  try {
    pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
  } catch (error) {
    throw new CodedError(
      'ERR_NOTIFICATIONS_PUSH_REGISTRATION_FAILED',
      'The device was unable to register for remote notifications with the browser endpoint. (' +
        error +
        ')'
    );
  }
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
  const notificationIcon = (Constants.expoConfig?.notification ?? {}).icon;
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
