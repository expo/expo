// @flow
import { NativeModules } from 'react-native';

const { ExponentAmplitude } = NativeModules;

export default {
  initialize(apiKey: string): void {
    return ExponentAmplitude.initialize(apiKey);
  },

  setUserId(userId: string): void {
    return ExponentAmplitude.setUserId(userId);
  },

  setUserProperties(userProperties: { [string]: any }): void {
    return ExponentAmplitude.setUserProperties(userProperties);
  },

  clearUserProperties(): void {
    return ExponentAmplitude.clearUserProperties();
  },

  logEvent(eventName: string): void {
    return ExponentAmplitude.logEvent(eventName);
  },

  logEventWithProperties(eventName: string, properties: { [string]: any }): void {
    return ExponentAmplitude.logEventWithProperties(eventName, properties);
  },

  setGroup(groupType: string, groupNames: Array<string>): void {
    return ExponentAmplitude.setGroup(groupType, groupNames);
  },
};
