import { NativeModules, Platform } from 'react-native';
export function initialize() {
    if (!NativeModules.TPSStripeManager && Platform.OS === 'ios') {
        console.warn(`We temporarily moved the Expo Payments API to ExpoKit. Please see the SDK 20 release notes for more information: https://blog.expo.io/expo-sdk-v20-0-0-is-now-available-79f84232a9d1`);
    }
}
const stripeModule = NativeModules.TPSStripeManager || NativeModules.StripeModule;
export default stripeModule;
//# sourceMappingURL=Payments.js.map