import { UnavailabilityError } from 'expo-errors';
import ExponentAmplitude from './ExponentAmplitude';

export default {
  initialize(apiKey: string): void {
    if (!ExponentAmplitude.initialize) {
      throw new UnavailabilityError('Amplitude', 'initialize');
    }
    return ExponentAmplitude.initialize(apiKey);
  },

  setUserId(userId: string): void {
    if (!ExponentAmplitude.setUserId) {
      throw new UnavailabilityError('Amplitude', 'setUserId');
    }
    return ExponentAmplitude.setUserId(userId);
  },

  setUserProperties(userProperties: { [name: string]: any }): void {
    if (!ExponentAmplitude.setUserProperties) {
      throw new UnavailabilityError('Amplitude', 'setUserProperties');
    }
    return ExponentAmplitude.setUserProperties(userProperties);
  },

  clearUserProperties(): void {
    if (!ExponentAmplitude.clearUserProperties) {
      throw new UnavailabilityError('Amplitude', 'clearUserProperties');
    }
    return ExponentAmplitude.clearUserProperties();
  },

  logEvent(eventName: string): void {
    if (!ExponentAmplitude.logEvent) {
      throw new UnavailabilityError('Amplitude', 'logEvent');
    }
    return ExponentAmplitude.logEvent(eventName);
  },

  logEventWithProperties(eventName: string, properties: { [name: string]: any }): void {
    if (!ExponentAmplitude.logEventWithProperties) {
      throw new UnavailabilityError('Amplitude', 'logEventWithProperties');
    }
    return ExponentAmplitude.logEventWithProperties(eventName, properties);
  },

  setGroup(groupType: string, groupNames: string[]): void {
    if (!ExponentAmplitude.setGroup) {
      throw new UnavailabilityError('Amplitude', 'setGroup');
    }
    return ExponentAmplitude.setGroup(groupType, groupNames);
  },
};
