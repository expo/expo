import { type EventSubscription, requireNativeModule } from 'expo-modules-core';

const ExpoLocalizationModule = requireNativeModule('ExpoLocalization');

export function addLocaleListener(
  // NOTE(@kitten): We never use the event's data
  listener: (event?: unknown) => void
): EventSubscription {
  return ExpoLocalizationModule.addListener('onLocaleSettingsChanged', listener);
}

export function addCalendarListener(
  // NOTE(@kitten): We never use the event's data
  listener: (event?: unknown) => void
): EventSubscription {
  return ExpoLocalizationModule.addListener('onCalendarSettingsChanged', listener);
}

export function removeSubscription(subscription: EventSubscription) {
  subscription.remove();
}

export default ExpoLocalizationModule;
