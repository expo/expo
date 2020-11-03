import { CodedError, Platform } from '@unimodules/core';
import * as Application from 'expo-application';
import ServerRegistrationModule from '../ServerRegistrationModule';
import generateRetries from './generateRetries';
import makeInterruptible from './makeInterruptible';
export const [updatePushTokenAsync, hasPushTokenBeenUpdated, interruptPushTokenUpdates,] = makeInterruptible(updatePushTokenAsyncGenerator);
async function* updatePushTokenAsyncGenerator(token) {
    // Fetch the latest registration info from the persisted storage
    const lastRegistrationInfo = yield ServerRegistrationModule.getLastRegistrationInfoAsync?.();
    // If there is none, do not do anything.
    if (!lastRegistrationInfo) {
        return;
    }
    // Prepare request body
    const lastRegistration = JSON.parse(lastRegistrationInfo);
    // Persist `pendingDevicePushToken` in case the app gets killed
    // before we finish registering to server.
    await ServerRegistrationModule.setLastRegistrationInfoAsync?.(JSON.stringify({
        ...lastRegistration,
        pendingDevicePushToken: token,
    }));
    const body = {
        ...lastRegistration.body,
        // Information whether a token is applicable
        // to development or production notification service
        // should never be persisted as it can change between
        // Xcode development and TestFlight/AppStore without
        // backing store being resetted (development registration
        // remains in production environment).
        development: await shouldUseDevelopmentNotificationService(),
        deviceToken: token.data,
        type: getTypeOfToken(token),
    };
    const retriesIterator = generateRetries(async (retry) => {
        try {
            const response = await fetch(lastRegistration.url, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(body),
            }).catch(error => {
                throw new CodedError('ERR_NOTIFICATIONS_NETWORK_ERROR', `Error encountered while updating device push token in server: ${error}.`);
            });
            // Help debug erroring servers
            if (!response.ok) {
                console.debug('[expo-notifications] Error encountered while updating device push token in server:', await response.text());
            }
            // Retry if request failed
            if (!response.ok) {
                retry();
            }
        }
        catch (e) {
            console.warn('[expo-notifications] Error thrown while updating device push token in server:', e);
            // We only want to retry if it was a network error.
            // Other error may be JSON.parse error which we can do nothing about.
            if (e instanceof CodedError && e.code === 'ERR_NOTIFICATIONS_NETWORK_ERROR') {
                retry();
            }
            else {
                // If we aren't going to try again, throw the error
                throw e;
            }
        }
    });
    let result = (yield retriesIterator.next());
    while (!result.done) {
        // We specifically want to yield the result here
        // to the calling function so that call to this generator
        // may be interrupted between retries.
        result = (yield retriesIterator.next());
    }
    // We uploaded the token successfully, let's clear the `pendingDevicePushToken`
    // from the registration so that we don't try to upload the same token
    // again.
    yield ServerRegistrationModule.setLastRegistrationInfoAsync?.(JSON.stringify({
        ...lastRegistration,
        pendingDevicePushToken: null,
    }));
}
// Same as in getExpoPushTokenAsync
function getTypeOfToken(devicePushToken) {
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
        }
        catch (e) {
            // We can't do anything here, we'll fallback to false then.
        }
    }
    return false;
}
//# sourceMappingURL=updatePushTokenAsync.js.map