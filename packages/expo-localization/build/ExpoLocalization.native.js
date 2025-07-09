import { requireNativeModule } from 'expo-modules-core';
const ExpoLocalizationModule = requireNativeModule('ExpoLocalization');
export function addLocaleListener(
// NOTE(@kitten): We never use the event's data
listener) {
    return ExpoLocalizationModule.addListener('onLocaleSettingsChanged', listener);
}
export function addCalendarListener(
// NOTE(@kitten): We never use the event's data
listener) {
    return ExpoLocalizationModule.addListener('onCalendarSettingsChanged', listener);
}
export function removeSubscription(subscription) {
    subscription.remove();
}
export default ExpoLocalizationModule;
//# sourceMappingURL=ExpoLocalization.native.js.map