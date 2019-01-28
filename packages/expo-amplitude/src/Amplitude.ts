import { UnavailabilityError } from 'expo-errors';
import ExponentAmplitude from './ExponentAmplitude';

export async function initialize(apiKey: string): Promise<any> {
  if (!ExponentAmplitude.initialize) {
    throw new UnavailabilityError('Amplitude', 'initialize');
  }
  return ExponentAmplitude.initialize(apiKey);
}

export async function setUserId(userId: string): Promise<any> {
  if (!ExponentAmplitude.setUserId) {
    throw new UnavailabilityError('Amplitude', 'setUserId');
  }
  return ExponentAmplitude.setUserId(userId);
}

export async function setUserProperties(userProperties: { [name: string]: any }): Promise<any> {
  if (!ExponentAmplitude.setUserProperties) {
    throw new UnavailabilityError('Amplitude', 'setUserProperties');
  }
  return ExponentAmplitude.setUserProperties(userProperties);
}

export async function clearUserProperties(): Promise<any> {
  if (!ExponentAmplitude.clearUserProperties) {
    throw new UnavailabilityError('Amplitude', 'clearUserProperties');
  }
  return ExponentAmplitude.clearUserProperties();
}

export async function logEvent(eventName: string): Promise<any> {
  if (!ExponentAmplitude.logEvent) {
    throw new UnavailabilityError('Amplitude', 'logEvent');
  }
  return ExponentAmplitude.logEvent(eventName);
}

export async function logEventWithProperties(eventName: string, properties: { [name: string]: any }): Promise<any> {
  if (!ExponentAmplitude.logEventWithProperties) {
    throw new UnavailabilityError('Amplitude', 'logEventWithProperties');
  }
  return ExponentAmplitude.logEventWithProperties(eventName, properties);
}

export async function setGroup(groupType: string, groupNames: string[]): Promise<any> {
  if (!ExponentAmplitude.setGroup) {
    throw new UnavailabilityError('Amplitude', 'setGroup');
  }
  return ExponentAmplitude.setGroup(groupType, groupNames);
}
