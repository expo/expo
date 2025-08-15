import { Platform } from 'react-native';
import ExpoAppIntegrity from './ExpoAppIntegrity';
export async function generateKey() {
    if (Platform.OS !== 'ios') {
        throw new Error('generateAssertion is only available on iOS');
    }
    return ExpoAppIntegrity.generateKey();
}
export async function attestKey(key, challenge) {
    if (Platform.OS !== 'ios') {
        throw new Error('generateAssertion is only available on iOS');
    }
    return ExpoAppIntegrity.attestKey(key, challenge);
}
export async function generateAssertion(key, json) {
    if (Platform.OS !== 'ios') {
        throw new Error('generateAssertion is only available on iOS');
    }
    return ExpoAppIntegrity.generateAssertion(key, json);
}
export async function requestIntegrityCheck(challenge) {
    if (Platform.OS !== 'android') {
        throw new Error('requestIntegrityCheck is only available on Android');
    }
    return ExpoAppIntegrity.requestIntegrityCheck(challenge);
}
export async function prepareIntegrityTokenProvider(cloudProjectNumber) {
    if (Platform.OS !== 'android') {
        throw new Error('prepareIntegrityTokenProvider is only available on Android');
    }
    return ExpoAppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
}
//# sourceMappingURL=AppIntegrity.js.map