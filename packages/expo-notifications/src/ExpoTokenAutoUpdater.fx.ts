import { Subscription } from '@unimodules/core';

import InstallationIdProvider from './InstallationIdProvider';
import { addPushTokenListener } from './TokenEmitter';
import { DevicePushToken } from './Tokens.types';
import getExpoPushTokenAsync from './getExpoPushTokenAsync';

// Possible getExpoPushTokenAsync options overrides
type Registration = {
  url: string;
  type?: string;
  deviceId?: string;
  development?: boolean;
  experienceId?: string;
  applicationId?: string;
};

/**
 * Informs active registrations of a given new device push token
 * @param token New device push token to inform registration of
 */
async function updateActiveRegistrationAsync(token: DevicePushToken) {
  await getExpoPushTokenAsync({
    ...activeRegistration,
    devicePushToken: token,
  });
}

// Module-wide storage
let activeRegistration: Registration | null = null;

// On startup fetch all active registrations and add them to the session storage.
InstallationIdProvider.getRegistrationsAsync?.()
  .then(async persistedRegistrationsObject => {
    // Parse all registrations and return only the valid ones
    const persistedRegistrations = Object.keys(persistedRegistrationsObject)
      .map(stringifiedRegistration => {
        try {
          return JSON.parse(stringifiedRegistration);
        } catch (e) {
          console.warn(
            '[expo-notifications] Could not have parsed the registration information for automatic token update.',
            stringifiedRegistration,
            e
          );
        }
      })
      .filter(registration => registration);

    // Set auto token registration only for the last valid registration
    if (persistedRegistrations.length > 0) {
      await setAutoTokenRegistrationAsync(
        persistedRegistrations[persistedRegistrations.length - 1]
      );
    }
  })
  .catch(error =>
    console.warn(
      '[expo-notifications] Could not have fetched the registration information for automatic token update.',
      error
    )
  );

let pushTokenSubscription: Subscription | null = null;

/**
 * Sets the registration information to the persisted storage so that the device push token
 * gets pushed to the given registration endpoint, overridding previous registrations
 * @param registration Registration endpoint to inform of new tokens
 */
export async function setAutoTokenRegistrationAsync(registration: Registration) {
  // Remove all other registrations (we use allSettled because we don't care
  // if the `set` succeeds there's nothing we can do about rejection)
  try {
    await InstallationIdProvider.setRegistrationAsync?.(JSON.stringify(activeRegistration), false);
  } catch (e) {
    console.warn(
      '[expo-notifications] Could not have removed the active registration information for automatic token update.',
      e
    );
  }

  // Add registration to this session storage
  activeRegistration = registration;

  // If the subscription has not been set up yet (no previous persisted registrations)
  if (!pushTokenSubscription) {
    // set it up so all registrations get latest push token received.
    pushTokenSubscription = addPushTokenListener(updateActiveRegistrationAsync);
  }

  // Ensure on next session the registration will get considered as active
  await InstallationIdProvider.setRegistrationAsync?.(JSON.stringify(registration), true);
}
