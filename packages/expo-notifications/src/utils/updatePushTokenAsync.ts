import { computeNextBackoffInterval } from '@ide/backoff';
import { CodedError, Platform, UnavailabilityError } from '@unimodules/core';
import { AbortSignal } from 'abort-controller';
import * as Application from 'expo-application';

import ServerRegistrationModule from '../ServerRegistrationModule';
import { DevicePushToken } from '../Tokens.types';

const updatePushTokenUrl = 'https://exp.host/--/api/v2/push/updateDeviceToken';

export async function updatePushTokenAsync(signal: AbortSignal, token: DevicePushToken) {
  const doUpdatePushTokenAsync = async (retry: () => void) => {
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
      // We don't consider AbortError a failure, it's a sign somewhere else the
      // request is expected to succeed and we don't need this one, so let's
      // just return.
      if (e.name === 'AbortError') {
        return;
      }

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
  };

  let shouldTry = true;
  const retry = () => {
    shouldTry = true;
  };

  let retriesCount = 0;
  const initialBackoff = 500; // 0.5 s
  const backoffOptions = {
    maxBackoff: 2 * 60 * 1000, // 2 minutes
  };
  let nextBackoffInterval = computeNextBackoffInterval(
    initialBackoff,
    retriesCount,
    backoffOptions
  );

  while (shouldTry && !signal.aborted) {
    // Will be set to true by `retry` if it's called
    shouldTry = false;
    await doUpdatePushTokenAsync(retry);

    // Do not wait if we won't retry
    if (shouldTry && !signal.aborted) {
      nextBackoffInterval = computeNextBackoffInterval(
        initialBackoff,
        retriesCount,
        backoffOptions
      );
      retriesCount += 1;
      await new Promise(resolve => setTimeout(resolve, nextBackoffInterval));
    }
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
