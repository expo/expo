import { EventEmitter, Subscription, requireNativeModule } from 'expo-modules-core';

const ExpoLocalizationModule = requireNativeModule('ExpoLocalization');
const emitter = new EventEmitter(ExpoLocalizationModule);

export function addLocaleListener(listener: (event) => void): Subscription {
  return emitter.addListener('onLocaleSettingsChanged', listener);
}

export function addCalendarListener(listener: (event) => void): Subscription {
  return emitter.addListener('onCalendarSettingsChanged', listener);
}

export function removeSubscription(subscription: Subscription) {
  return emitter.removeSubscription(subscription);
}

export default ExpoLocalizationModule;
