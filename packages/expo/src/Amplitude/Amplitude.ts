import UnsupportedError from '../UnsupportedError';
import ExponentAmplitude from './ExponentAmplitude';

export default {
  initialize(apiKey: string): void {
    if (!ExponentAmplitude.initialize) {
      throw new UnsupportedError('Amplitude', 'initialize');
    }
    return ExponentAmplitude.initialize(apiKey);
  },

  setUserId(userId: string): void {
    if (!ExponentAmplitude.setUserId) {
      throw new UnsupportedError('Amplitude', 'setUserId');
    }
    return ExponentAmplitude.setUserId(userId);
  },

  setUserProperties(userProperties: { [name: string]: any }): void {
    if (!ExponentAmplitude.setUserProperties) {
      throw new UnsupportedError('Amplitude', 'setUserProperties');
    }
    return ExponentAmplitude.setUserProperties(userProperties);
  },

  clearUserProperties(): void {
    if (!ExponentAmplitude.clearUserProperties) {
      throw new UnsupportedError('Amplitude', 'clearUserProperties');
    }
    return ExponentAmplitude.clearUserProperties();
  },

  logEvent(eventName: string): void {
    if (!ExponentAmplitude.logEvent) {
      throw new UnsupportedError('Amplitude', 'logEvent');
    }
    return ExponentAmplitude.logEvent(eventName);
  },

  logEventWithProperties(eventName: string, properties: { [name: string]: any }): void {
    if (!ExponentAmplitude.logEventWithProperties) {
      throw new UnsupportedError('Amplitude', 'logEventWithProperties');
    }
    return ExponentAmplitude.logEventWithProperties(eventName, properties);
  },

  setGroup(groupType: string, groupNames: string[]): void {
    if (!ExponentAmplitude.setGroup) {
      throw new UnsupportedError('Amplitude', 'setGroup');
    }
    return ExponentAmplitude.setGroup(groupType, groupNames);
  },
};
