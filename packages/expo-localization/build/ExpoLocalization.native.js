import { EventEmitter, requireNativeModule } from 'expo-modules-core';
const ExpoLocalizationModule = requireNativeModule('ExpoLocalization');
const emitter = new EventEmitter(ExpoLocalizationModule);
export function addLocaleListener(listener) {
    return emitter.addListener('onLocaleSettingsChanged', listener);
}
export function addCalendarListener(listener) {
    return emitter.addListener('onCalendarSettingsChanged', listener);
}
export function removeSubscription(subscription) {
    return emitter.removeSubscription(subscription);
}
export default ExpoLocalizationModule;
//# sourceMappingURL=ExpoLocalization.native.js.map