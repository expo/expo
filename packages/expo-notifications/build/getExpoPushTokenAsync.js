import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform, CodedError, UnavailabilityError } from 'expo-modules-core';
import { setAutoServerRegistrationEnabledAsync } from './DevicePushTokenAutoRegistration.fx';
import ServerRegistrationModule from './ServerRegistrationModule';
import getDevicePushTokenAsync from './getDevicePushTokenAsync';
const productionBaseUrl = 'https://exp.host/--/api/v2/';
/**
 * Returns an Expo token that can be used to send a push notification to the device using Expo's push notifications service.
 *
 * This method makes requests to the Expo's servers. It can get rejected in cases where the request itself fails
 * (for example, due to the device being offline, experiencing a network timeout, or other HTTPS request failures).
 * To provide offline support to your users, you should `try/catch` this method and implement retry logic to attempt
 * to get the push token later, once the device is back online.
 *
 * > For Expo's backend to be able to send notifications to your app, you will need to provide it with push notification keys.
 * For more information, see [credentials](/push-notifications/push-notifications-setup/#get-credentials-for-development-builds) in the push notifications setup.
 *
 * @param options Object allowing you to pass in push notification configuration.
 * @return Returns a `Promise` that resolves to an object representing acquired push token.
 * @header fetch
 *
 * @example
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export async function registerForPushNotificationsAsync(userId: string) {
 *   const expoPushToken = await Notifications.getExpoPushTokenAsync({
 *    projectId: 'your-project-id',
 *   });
 *
 *   await fetch('https://example.com/', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       userId,
 *       expoPushToken,
 *     }),
 *   });
 * }
 * ```
 */
export default async function getExpoPushTokenAsync(options = {}) {
    const devicePushToken = options.devicePushToken || (await getDevicePushTokenAsync());
    const deviceId = options.deviceId || (await getDeviceIdAsync());
    const experienceId = options.experienceId || Constants.expoConfig?.originalFullName || Constants.manifest?.id;
    const projectId = options.projectId ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.manifest?.projectId;
    if (!projectId) {
        console.warn('Calling getExpoPushTokenAsync without specifying a projectId is deprecated and will no longer be supported in SDK 49+');
    }
    if (!experienceId && !projectId) {
        throw new CodedError('ERR_NOTIFICATIONS_NO_EXPERIENCE_ID', "No experienceId or projectId found. If one or the other can't be inferred from the manifest (eg. in bare workflow), you have to pass one in yourself.");
    }
    const applicationId = options.applicationId || Application.applicationId;
    if (!applicationId) {
        throw new CodedError('ERR_NOTIFICATIONS_NO_APPLICATION_ID', "No applicationId found. If it can't be inferred from native configuration by expo-application, you have to pass it in yourself.");
    }
    const type = options.type || getTypeOfToken(devicePushToken);
    const development = options.development || (await shouldUseDevelopmentNotificationService());
    const baseUrl = options.baseUrl ?? productionBaseUrl;
    const url = options.url ?? `${baseUrl}push/getExpoPushToken`;
    const body = {
        type,
        deviceId: deviceId.toLowerCase(),
        development,
        appId: applicationId,
        deviceToken: getDeviceToken(devicePushToken),
        ...(projectId ? { projectId } : { experienceId }),
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    }).catch((error) => {
        throw new CodedError('ERR_NOTIFICATIONS_NETWORK_ERROR', `Error encountered while fetching Expo token: ${error}.`);
    });
    if (!response.ok) {
        const statusInfo = response.statusText || response.status;
        let body = undefined;
        try {
            body = await response.text();
        }
        catch {
            // do nothing
        }
        throw new CodedError('ERR_NOTIFICATIONS_SERVER_ERROR', `Error encountered while fetching Expo token, expected an OK response, received: ${statusInfo} (body: "${body}").`);
    }
    const expoPushToken = getExpoPushToken(await parseResponse(response));
    try {
        if (options.url || options.baseUrl) {
            console.debug(`[expo-notifications] Since the URL endpoint to register in has been customized in the options, expo-notifications won't try to auto-update the device push token on the server.`);
        }
        else {
            await setAutoServerRegistrationEnabledAsync(true);
        }
    }
    catch (e) {
        console.warn('[expo-notifications] Could not enable automatically registering new device tokens with the Expo notification service', e);
    }
    return {
        type: 'expo',
        data: expoPushToken,
    };
}
async function parseResponse(response) {
    try {
        return await response.json();
    }
    catch {
        try {
            throw new CodedError('ERR_NOTIFICATIONS_SERVER_ERROR', `Expected a JSON response from server when fetching Expo token, received body: ${JSON.stringify(await response.text())}.`);
        }
        catch {
            throw new CodedError('ERR_NOTIFICATIONS_SERVER_ERROR', `Expected a JSON response from server when fetching Expo token, received response: ${JSON.stringify(response)}.`);
        }
    }
}
function getExpoPushToken(data) {
    if (!data ||
        !(typeof data === 'object') ||
        !data.data ||
        !(typeof data.data === 'object') ||
        !data.data.expoPushToken ||
        !(typeof data.data.expoPushToken === 'string')) {
        throw new CodedError('ERR_NOTIFICATIONS_SERVER_ERROR', `Malformed response from server, expected "{ data: { expoPushToken: string } }", received: ${JSON.stringify(data, null, 2)}.`);
    }
    return data.data.expoPushToken;
}
// Same as in DevicePushTokenAutoRegistration
async function getDeviceIdAsync() {
    try {
        if (!ServerRegistrationModule.getInstallationIdAsync) {
            throw new UnavailabilityError('ExpoServerRegistrationModule', 'getInstallationIdAsync');
        }
        return await ServerRegistrationModule.getInstallationIdAsync();
    }
    catch (e) {
        throw new CodedError('ERR_NOTIF_DEVICE_ID', `Could not have fetched installation ID of the application: ${e}.`);
    }
}
function getDeviceToken(devicePushToken) {
    if (typeof devicePushToken.data === 'string') {
        return devicePushToken.data;
    }
    return JSON.stringify(devicePushToken.data);
}
// Same as in DevicePushTokenAutoRegistration
async function shouldUseDevelopmentNotificationService() {
    if (Platform.OS === 'ios') {
        try {
            const notificationServiceEnvironment = await Application.getIosPushNotificationServiceEnvironmentAsync();
            if (notificationServiceEnvironment === 'development') {
                return true;
            }
        }
        catch {
            // We can't do anything here, we'll fallback to false then.
        }
    }
    return false;
}
// Same as in DevicePushTokenAutoRegistration
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
//# sourceMappingURL=getExpoPushTokenAsync.js.map