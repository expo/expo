import ServerRegistrationModule from './ServerRegistrationModule';
import { addPushTokenListener } from './TokenEmitter';
import { updatePushTokenAsync, hasPushTokenBeenUpdated, interruptPushTokenUpdates, } from './utils/updatePushTokenAsync';
/**
 * Sets the last registration information so that the device push token
 * gets pushed to the given registration endpoint
 * @param registration Registration endpoint to inform of new tokens
 */
export async function setAutoServerRegistrationAsync(registration) {
    // We are overwriting registration, so we shouldn't let
    // any pending request complete.
    interruptPushTokenUpdates();
    // Remember the registration information for future token updates.
    await ServerRegistrationModule.setLastRegistrationInfoAsync?.(JSON.stringify(registration));
}
/**
 * Removes last Expo server registration, future device push token
 * updates won't get sent there anymore.
 */
export async function removeAutoServerRegistrationAsync() {
    // We are removing registration, so we shouldn't let
    // any pending request complete.
    interruptPushTokenUpdates();
    // Do not consider any registration when token updates.
    await ServerRegistrationModule.setLastRegistrationInfoAsync?.(null);
}
export async function __handlePersistedRegistrationInfoAsync(lastRegistrationInfo) {
    if (!lastRegistrationInfo) {
        // No last registration info, nothing to do
        return;
    }
    try {
        const lastRegistration = JSON.parse(lastRegistrationInfo);
        // We only want to retry if `hasPushTokenBeenUpdated` is false.
        // If it were true it means that another call to `updatePushTokenAsync`
        // has already occured which could only happen from the listener
        // which has newer information than persisted storage.
        if (lastRegistration?.pendingDevicePushToken && !hasPushTokenBeenUpdated()) {
            updatePushTokenAsync(lastRegistration.pendingDevicePushToken);
        }
    }
    catch (e) {
        console.warn('[expo-notifications] Error encountered while fetching last registration information for auto token updates.', e);
    }
}
// Verify if last persisted registration
// has successfully uploaded last known
// device push token. If not, retry.
ServerRegistrationModule.getLastRegistrationInfoAsync?.().then(__handlePersistedRegistrationInfoAsync);
// A global scope (to get all the updates) device push token
// subscription, never cleared.
addPushTokenListener(token => {
    // Dispatch an abortable task to update
    // last registration with new token.
    updatePushTokenAsync(token);
});
//# sourceMappingURL=DevicePushTokenAutoRegistration.fx.js.map