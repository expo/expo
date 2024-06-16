import { requireNativeModule } from 'expo-modules-core';
const ExpoLocalizationModule = requireNativeModule('ExpoLocalization');
export function addLocaleListener(listener) {
    return ExpoLocalizationModule.addListener('onLocaleSettingsChanged', listener);
}
export function addCalendarListener(listener) {
    return ExpoLocalizationModule.addListener('onCalendarSettingsChanged', listener);
}
export function removeSubscription(subscription) {
    subscription.remove();
}
export default ExpoLocalizationModule;
//# sourceMappingURL=ExpoLocalization.native.js.map