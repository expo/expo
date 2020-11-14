import { CodedError, Platform, UnavailabilityError } from '@unimodules/core';
import * as Application from 'expo-application';

import ServerRegistrationModule from '../ServerRegistrationModule';
import { DevicePushToken } from '../Tokens.types';
import generateRetries from './generateRetries';
import makeInterruptible from './makeInterruptible';

export const [
  updatePushTokenAsync,
  hasPushTokenBeenUpdated,
  interruptPushTokenUpdates,
] = makeInterruptible<[DevicePushToken]>(updatePushTokenAsyncGenerator);

const updatePushTokenUrl = 'https://exp.host/--/api/v2/push/updateDeviceToken';

function* updatePushTokenAsyncGenerator(signal: AbortSignal, token: DevicePushToken) {
  const retriesIterator = generateRetries(async retry => {
    try {
      const body = {
        development: await shouldUseDevelopmentNotificationService(),
        deviceToken: token.data,
        appId: Application.applicationId,
        deviceId: await getDeviceIdAsync(),
        type: getTypeOfToken(token),
      };

      const response = await fetch(updatePushTokenUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      }).catch(error => {
        // Error returned if the request is aborted should have 'AbortError'. In
        // React Native fetch is polyfilled using `whatwg-fetch` which:
        // - creates `AbortError`s like this
        //   https://github.com/github/fetch/blob/75d9455d380f365701151f3ac85c5bda4bbbde76/fetch.js#L505
        // - which creates exceptions like
        //   https://github.com/github/fetch/blob/75d9455d380f365701151f3ac85c5bda4bbbde76/fetch.js#L490-L494
        if (error.name === 'AbortError') {
          throw error;
        } else {
          throw new CodedError(
            'ERR_NOTIFICATIONS_NETWORK_ERROR',
            `Error encountered while updating device push token in server: ${error}.`
          );
        }
      });

      // Help debug erroring servers
      if (!response.ok) {
        console.debug(
          '[expo-notifications] Error encountered while updating device push token in server:',
          await response.text()
        );
      }

      // Retry if request failed
      if (!response.ok) {
        retry();
      }
    } catch (e) {
      console.warn(
        '[expo-notifications] Error thrown while updating device push token in server:',
        e
      );

      // We only want to retry if it was a network error.
      // Other error may be JSON.parse error which we can do nothing about.
      if (e instanceof CodedError && (e as CodedError).code === 'ERR_NOTIFICATIONS_NETWORK_ERROR') {
        retry();
      } else {
        // If we aren't going to try again, throw the error
        throw e;
      }
    }
  });

  let result = (yield retriesIterator.next()) as IteratorResult<void, void>;
  while (!result.done) {
    // We specifically want to yield the result here
    // to the calling function so that call to this generator
    // may be interrupted between retries.
    result = (yield retriesIterator.next()) as IteratorResult<void, void>;
  }
}

// Same as in getExpoPushTokenAsync
async function getDeviceIdAsync() {
  try {
    if (!ServerRegistrationModule.getInstallationIdAsync) {
      throw new UnavailabilityError('ExpoServerRegistrationModule', 'getInstallationIdAsync');
    }

    return await ServerRegistrationModule.getInstallationIdAsync();
  } catch (e) {
    throw new CodedError(
      'ERR_NOTIFICATIONS_DEVICE_ID',
      `Could not have fetched installation ID of the application: ${e}.`
    );
  }
}

// Same as in getExpoPushTokenAsync
function getTypeOfToken(devicePushToken: DevicePushToken) {
  switch (devicePushToken.type) {
    case 'ios':
      return 'apns';
    case 'android':
      return 'fcm';
    // This probably will error on server, but let's make this function future-safe.
    default:
      return devicePushToken.type;
  }
}

// Same as in getExpoPushTokenAsync
async function shouldUseDevelopmentNotificationService() {
  if (Platform.OS === 'ios') {
    try {
      const notificationServiceEnvironment = await Application.getIosPushNotificationServiceEnvironmentAsync();
      if (notificationServiceEnvironment === 'development') {
        return true;
      }
    } catch (e) {
      // We can't do anything here, we'll fallback to false then.
    }
  }

  return false;
}
