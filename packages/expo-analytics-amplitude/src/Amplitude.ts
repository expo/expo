import { UnavailabilityError } from '@unimodules/core';

import ExpoAmplitude from './ExpoAmplitude';

export interface AmplitudeTrackingOptions {
  disableAdid?: boolean;
  disableCarrier?: boolean;
  disableCity?: boolean;
  disableCountry?: boolean;
  disableDeviceBrand?: boolean;
  disableDeviceManufacturer?: boolean;
  disableDeviceModel?: boolean;
  disableDMA?: boolean;
  disableIDFV?: boolean;
  disableIPAddress?: boolean;
  disableLanguage?: boolean;
  disableLatLng?: boolean;
  disableOSName?: boolean;
  disableOSVersion?: boolean;
  disablePlatform?: boolean;
  disableRegion?: boolean;
  disableVersionName?: boolean;
}

export async function initializeAsync(apiKey: string): Promise<void> {
  if (!ExpoAmplitude.initializeAsync) {
    throw new UnavailabilityError('Amplitude', 'initializeAsync');
  }
  return await ExpoAmplitude.initializeAsync(apiKey);
}

export async function setUserIdAsync(userId: string): Promise<void> {
  if (!ExpoAmplitude.setUserIdAsync) {
    throw new UnavailabilityError('Amplitude', 'setUserIdAsync');
  }
  return await ExpoAmplitude.setUserIdAsync(userId);
}

export async function setUserPropertiesAsync(userProperties: {
  [name: string]: any;
}): Promise<void> {
  if (!ExpoAmplitude.setUserPropertiesAsync) {
    throw new UnavailabilityError('Amplitude', 'setUserPropertiesAsync');
  }
  return await ExpoAmplitude.setUserPropertiesAsync(userProperties);
}

export async function clearUserPropertiesAsync(): Promise<void> {
  if (!ExpoAmplitude.clearUserPropertiesAsync) {
    throw new UnavailabilityError('Amplitude', 'clearUserPropertiesAsync');
  }
  return await ExpoAmplitude.clearUserPropertiesAsync();
}

export async function logEventAsync(eventName: string): Promise<void> {
  if (!ExpoAmplitude.logEventAsync) {
    throw new UnavailabilityError('Amplitude', 'logEventAsync');
  }
  return await ExpoAmplitude.logEventAsync(eventName);
}

export async function logEventWithPropertiesAsync(
  eventName: string,
  properties: { [name: string]: any }
): Promise<void> {
  if (!ExpoAmplitude.logEventWithPropertiesAsync) {
    throw new UnavailabilityError('Amplitude', 'logEventWithPropertiesAsync');
  }
  return await ExpoAmplitude.logEventWithPropertiesAsync(eventName, properties);
}

export async function setGroupAsync(groupType: string, groupNames: string[]): Promise<void> {
  if (!ExpoAmplitude.setGroupAsync) {
    throw new UnavailabilityError('Amplitude', 'setGroupAsync');
  }
  return await ExpoAmplitude.setGroupAsync(groupType, groupNames);
}

export async function setTrackingOptionsAsync(options: AmplitudeTrackingOptions): Promise<void> {
  if (!ExpoAmplitude.setTrackingOptionsAsync) {
    throw new UnavailabilityError('Amplitude', 'setTrackingOptionsAsync');
  }
  return await ExpoAmplitude.setTrackingOptionsAsync(options);
}

/*
 * Legacy methods for backwards-compatibility.
 * These should be removed in SDK 41
 */

/**
 * @deprecated Use initializeAsync instead
 */
export async function initialize(apiKey: string): Promise<void> {
  console.warn(
    "'Amplitude.initialize' is deprecated in favor of 'Amplitude.initializeAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await initializeAsync(apiKey);
}

/**
 * @deprecated Use setUserIdAsync instead
 */
export async function setUserId(userId: string): Promise<void> {
  console.warn(
    "'Amplitude.setUserId' is deprecated in favor of 'Amplitude.setUserIdAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await setUserIdAsync(userId);
}

/**
 * @deprecated Use setUserPropertiesAsync instead
 */
export async function setUserProperties(userProperties: { [name: string]: any }): Promise<void> {
  console.warn(
    "'Amplitude.setUserProperties' is deprecated in favor of 'Amplitude.setUserPropertiesAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await setUserPropertiesAsync(userProperties);
}

/**
 * @deprecated Use clearUserPropertiesAsync instead
 */
export async function clearUserProperties(): Promise<void> {
  console.warn(
    "'Amplitude.clearUserProperties' is deprecated in favor of 'Amplitude.clearUserPropertiesAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await clearUserPropertiesAsync();
}

/**
 * @deprecated Use logEventAsync instead
 */
export async function logEvent(eventName: string): Promise<void> {
  console.warn(
    "'Amplitude.logEvent' is deprecated in favor of 'Amplitude.logEventAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await logEventAsync(eventName);
}

/**
 * @deprecated Use logEventWithPropertiesAsync instead
 */
export async function logEventWithProperties(
  eventName: string,
  properties: { [name: string]: any }
): Promise<void> {
  console.warn(
    "'Amplitude.logEventWithProperties' is deprecated in favor of 'Amplitude.logEventWithPropertiesAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await logEventWithPropertiesAsync(eventName, properties);
}

/**
 * @deprecated Use setGroupAsync instead
 */
export async function setGroup(groupType: string, groupNames: string[]): Promise<void> {
  console.warn(
    "'Amplitude.setGroup' is deprecated in favor of 'Amplitude.setGroupAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await setGroupAsync(groupType, groupNames);
}

/**
 * @deprecated Use setTrackingOptionsAsync instead
 */
export async function setTrackingOptions(options: AmplitudeTrackingOptions): Promise<void> {
  console.warn(
    "'Amplitude.setTrackingOptions' is deprecated in favor of 'Amplitude.setTrackingOptionsAsync'. Please use the new method, which contains no user-facing changes."
  );
  return await setTrackingOptionsAsync(options);
}
