import InstallationIdProvider from './InstallationIdProvider';
import { addPushTokenListener } from './TokenEmitter';
import getExpoPushTokenAsync from './getExpoPushTokenAsync';
/**
 * Informs all registrations of a given new device push token
 * @param token New device push token to inform all registrations of
 */
async function updateRegistrationsAsync(token) {
    return Promise.allSettled(registrations.map(registration => getExpoPushTokenAsync({
        ...registration,
        devicePushToken: token,
    })));
}
// Module-wide storage
const registrations = [];
// On startup fetch all active registrations and add them to the session storage.
InstallationIdProvider.getRegistrationsAsync?.()
    .then(async (persistedRegistrations) => {
    for (const stringifiedRegistration of Object.keys(persistedRegistrations)) {
        // One registration fail shouldn't fail all registrations
        try {
            await addAutoTokenRegistrationAsync(JSON.parse(stringifiedRegistration));
        }
        catch (e) {
            console.warn('[expo-notifications] Could not have parsed the registration information for automatic token update.', stringifiedRegistration, e);
        }
    }
})
    .catch(error => console.warn('[expo-notifications] Could not have fetched the registration information for automatic token update.', error));
let pushTokenSubscription = null;
/**
 * Adds the registration information to the persisted storage so that the device push token
 * gets pushed to the given registration endpoint
 * @param registration Registration endpoint to inform of new tokens
 */
export async function addAutoTokenRegistrationAsync(registration) {
    // Add registration to this session storage
    registrations.push(registration);
    // If the subscription has not been set up yet (no previous persisted registrations)
    if (!pushTokenSubscription) {
        // set it up so all registrations get latest push token received.
        pushTokenSubscription = addPushTokenListener(updateRegistrationsAsync);
    }
    // Ensure on next session the registration will get considered as active
    await InstallationIdProvider.setRegistrationAsync?.(JSON.stringify(registration), true);
}
//# sourceMappingURL=ExpoTokenAutoUpdater.fx.js.map