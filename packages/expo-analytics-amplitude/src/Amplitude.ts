import { UnavailabilityError } from '@unimodules/core';
import ExpoAmplitude from './ExpoAmplitude';

export function initialize(apiKey: string): Promise<void> {
  if (!ExpoAmplitude.initialize) {
    throw new UnavailabilityError('Amplitude', 'initialize');
  }
  return ExpoAmplitude.initialize(apiKey);
};

export function setUserId(userId: string): Promise<void> {
  if (!ExpoAmplitude.setUserId) {
    throw new UnavailabilityError('Amplitude', 'setUserId');
  }
  return ExpoAmplitude.setUserId(userId);
};

export function setUserProperties(userProperties: { [name: string]: any }): Promise<void> {
  if (!ExpoAmplitude.setUserProperties) {
    throw new UnavailabilityError('Amplitude', 'setUserProperties');
  }
  return ExpoAmplitude.setUserProperties(userProperties);
};

export function clearUserProperties(): Promise<void> {
  if (!ExpoAmplitude.clearUserProperties) {
    throw new UnavailabilityError('Amplitude', 'clearUserProperties');
  }
  return ExpoAmplitude.clearUserProperties();
};

export function logEvent(eventName: string): Promise<void> {
  if (!ExpoAmplitude.logEvent) {
    throw new UnavailabilityError('Amplitude', 'logEvent');
  }
  return ExpoAmplitude.logEvent(eventName);
};

export function logEventWithProperties(eventName: string, properties: { [name: string]: any }): Promise<void> {
  if (!ExpoAmplitude.logEventWithProperties) {
    throw new UnavailabilityError('Amplitude', 'logEventWithProperties');
  }
  return ExpoAmplitude.logEventWithProperties(eventName, properties);
};

export function setGroup(groupType: string, groupNames: string[]): Promise<void> {
  if (!ExpoAmplitude.setGroup) {
    throw new UnavailabilityError('Amplitude', 'setGroup');
  }
  return ExpoAmplitude.setGroup(groupType, groupNames);
};
