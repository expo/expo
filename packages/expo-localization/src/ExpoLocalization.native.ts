import { type EventSubscription, requireNativeModule } from 'expo-modules-core';

const ExpoLocalizationModule = requireNativeModule('ExpoLocalization');

export function addLocaleListener(listener: (event) => void): EventSubscription {
  return ExpoLocalizationModule.addListener('onLocaleSettingsChanged', listener);
}

export function addCalendarListener(listener: (event) => void): EventSubscription {
  return ExpoLocalizationModule.addListener('onCalendarSettingsChanged', listener);
}

export function removeSubscription(subscription: EventSubscription) {
  subscription.remove();
}

export default ExpoLocalizationModule;
