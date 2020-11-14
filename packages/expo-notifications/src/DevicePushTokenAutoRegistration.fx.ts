import ServerRegistrationModule from './ServerRegistrationModule';
import { addPushTokenListener } from './TokenEmitter';
import getDevicePushTokenAsync from './getDevicePushTokenAsync';
import { updatePushTokenAsync, interruptPushTokenUpdates } from './utils/updatePushTokenAsync';

/**
 * Encapsulates device server registration data
 */
export type DevicePushTokenRegistration = {
  isEnabled: boolean;
};

/**
 * Sets the registration information so that the device push token gets pushed
 * to the given registration endpoint
 * @param registration Registration endpoint to inform of new tokens
 */
export async function setAutoServerRegistrationEnabledAsync(enabled: boolean) {
  // We are overwriting registration, so we shouldn't let
  // any pending request complete.
  interruptPushTokenUpdates();

  await ServerRegistrationModule.setRegistrationInfoAsync?.(
    enabled ? JSON.stringify({ isEnabled: enabled }) : null
  );
}

/**
 * This function is exported only for testing purposes.
 */
export async function __handlePersistedRegistrationInfoAsync(
  registrationInfo: string | null | undefined
) {
  if (!registrationInfo) {
    // No registration info, nothing to do
    return;
  }

  let registration: DevicePushTokenRegistration | null = null;
  try {
    registration = JSON.parse(registrationInfo);
  } catch (e) {
    console.warn(
      '[expo-notifications] Error encountered while fetching registration information for auto token updates.',
      e
    );
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
  } catch (e) {
    console.warn(
      '[expo-notifications] Error encountered while updating server registration with latest device push token.',
      e
    );
  }
}

// Verify if persisted registration
// has successfully uploaded last known
// device push token. If not, retry.
ServerRegistrationModule.getRegistrationInfoAsync?.().then(__handlePersistedRegistrationInfoAsync);

// A global scope (to get all the updates) device push token
// subscription, never cleared.
addPushTokenListener(token => {
  // Dispatch an abortable task to update
  // registration with new token.
  updatePushTokenAsync(token);
});
