import 'abort-controller/polyfill';
import { UnavailabilityError } from 'expo-modules-core';
import ServerRegistrationModule from './ServerRegistrationModule';
import { addPushTokenListener } from './TokenEmitter';
import getDevicePushTokenAsync from './getDevicePushTokenAsync';
import { updateDevicePushTokenAsync as updateDevicePushTokenAsyncWithSignal } from './utils/updateDevicePushTokenAsync';
let lastAbortController = null;
async function updatePushTokenAsync(token) {
    // Abort current update process
    lastAbortController?.abort();
    lastAbortController = new AbortController();
    return await updateDevicePushTokenAsyncWithSignal(lastAbortController.signal, token);
}
/**
 * Sets the registration information so that the device push token gets pushed
 * to the given registration endpoint
 * @param enabled
 */
export async function setAutoServerRegistrationEnabledAsync(enabled) {
    // We are overwriting registration, so we shouldn't let
    // any pending request complete.
    lastAbortController?.abort();
    if (!ServerRegistrationModule.setRegistrationInfoAsync) {
        throw new UnavailabilityError('ServerRegistrationModule', 'setRegistrationInfoAsync');
    }
    await ServerRegistrationModule.setRegistrationInfoAsync(enabled ? JSON.stringify({ isEnabled: enabled }) : null);
}
// note(Chmiela): This function is exported only for testing purposes.
export async function __handlePersistedRegistrationInfoAsync(registrationInfo) {
    if (!registrationInfo) {
        // No registration info, nothing to do
        return;
    }
    let registration = null;
    try {
        registration = JSON.parse(registrationInfo);
    }
    catch (e) {
        console.warn('[expo-notifications] Error encountered while fetching registration information for auto token updates.', e);
    }
    if (!registration?.isEnabled) {
        // Registration is invalid or not enabled, nothing more to do
        return;
    }
    try {
        // Since the registration is enabled, fetching a "new" device token
        // shouldn't be a problem.
        const latestDevicePushToken = await getDevicePushTokenAsync();
        await updatePushTokenAsync(latestDevicePushToken);
    }
    catch (e) {
        console.warn('[expo-notifications] Error encountered while updating server registration with latest device push token.', e);
    }
}
if (ServerRegistrationModule.getRegistrationInfoAsync) {
    // A global scope (to get all the updates) device push token
    // subscription, never cleared.
    addPushTokenListener(async (token) => {
        try {
            // Before updating the push token on server we always check if we should
            // Since modules can't change their method availability while running, we
            // can assert it's defined.
            const registrationInfo = await ServerRegistrationModule.getRegistrationInfoAsync();
            if (!registrationInfo) {
                // Registration is not enabled
                return;
            }
            const registration = JSON.parse(registrationInfo);
            if (registration?.isEnabled) {
                // Dispatch an abortable task to update
                // registration with new token.
                await updatePushTokenAsync(token);
            }
        }
        catch (e) {
            console.warn('[expo-notifications] Error encountered while updating server registration with latest device push token.', e);
        }
    });
    // Verify if persisted registration
    // has successfully uploaded last known
    // device push token. If not, retry.
    ServerRegistrationModule.getRegistrationInfoAsync().then(__handlePersistedRegistrationInfoAsync);
}
else {
    console.warn(`[expo-notifications] Error encountered while fetching auto-registration state, new tokens will not be automatically registered on server.`, new UnavailabilityError('ServerRegistrationModule', 'getRegistrationInfoAsync'));
}
//# sourceMappingURL=DevicePushTokenAutoRegistration.fx.js.map