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
  disableIDFA?: boolean;
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

export function initialize(apiKey: string) {
  if (!ExpoAmplitude.initialize) {
    throw new UnavailabilityError('Amplitude', 'initialize');
  }
  ExpoAmplitude.initialize(apiKey);
}

export function setUserId(userId: string) {
  if (!ExpoAmplitude.setUserId) {
    throw new UnavailabilityError('Amplitude', 'setUserId');
  }
  ExpoAmplitude.setUserId(userId);
}

export function setUserProperties(userProperties: { [name: string]: any }) {
  if (!ExpoAmplitude.setUserProperties) {
    throw new UnavailabilityError('Amplitude', 'setUserProperties');
  }
  ExpoAmplitude.setUserProperties(userProperties);
}

export function clearUserProperties() {
  if (!ExpoAmplitude.clearUserProperties) {
    throw new UnavailabilityError('Amplitude', 'clearUserProperties');
  }
  ExpoAmplitude.clearUserProperties();
}

export async function logEventAsync(eventName: string): Promise<void> {
  if (!ExpoAmplitude.logEventAsync) {
    throw new UnavailabilityError('Amplitude', 'logEventAsync');
  }
  return ExpoAmplitude.logEventAsync(eventName);
}

export async function logEventWithPropertiesAsync(
  eventName: string,
  properties: { [name: string]: any }
): Promise<void> {
  if (!ExpoAmplitude.logEventWithPropertiesAsync) {
    throw new UnavailabilityError('Amplitude', 'logEventWithPropertiesAsync');
  }
  return ExpoAmplitude.logEventWithPropertiesAsync(eventName, properties);
}

export function setGroup(groupType: string, groupNames: string[]) {
  if (!ExpoAmplitude.setGroup) {
    throw new UnavailabilityError('Amplitude', 'setGroup');
  }
  ExpoAmplitude.setGroup(groupType, groupNames);
}

export function setTrackingOptions(options: AmplitudeTrackingOptions) {
  if (!ExpoAmplitude.setTrackingOptions) {
    throw new UnavailabilityError('Amplitude', 'setTrackingOptions');
  }
  return ExpoAmplitude.setTrackingOptions(options);
}

// Keep to avoid an abrupt breaking change
export function logEvent(eventName: string): Promise<void> {
  console.log(
    'This method is deprecated. Please use Amplitude.logEventAsync instead (it is functionally the same).'
  );
  if (!ExpoAmplitude.logEventAsync) {
    throw new UnavailabilityError('Amplitude', 'logEventAsync');
  }
  return ExpoAmplitude.logEventAsync(eventName);
}

export function logEventWithProperties(
  eventName: string,
  properties: { [name: string]: any }
): Promise<void> {
  console.log(
    'This method is deprecated. Please use Amplitude.logEventWithPropertiesAsync instead (it is functionally the same).'
  );
  if (!ExpoAmplitude.logEventWithPropertiesAsync) {
    throw new UnavailabilityError('Amplitude', 'logEventWithPropertiesAsync');
  }
  return ExpoAmplitude.logEventWithPropertiesAsync(eventName, properties);
}
