import { Platform } from 'expo-modules-core';
const LOCAL_STORAGE_KEY = 'EXPO_ERROR_RECOVERY_STORAGE';
function _consumeRecoveryProps() {
    if (!Platform.isDOMAvailable)
        return null;
    try {
        const props = localStorage.getItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return props;
    }
    catch {
        // Catches localStorage SecurityError https://github.com/expo/expo/issues/8355
    }
    return null;
}
export default {
    get name() {
        return 'ExpoErrorRecovery';
    },
    saveRecoveryProps(props) {
        if (!Platform.isDOMAvailable)
            return;
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, props);
        }
        catch {
            // Catches localStorage SecurityError https://github.com/expo/expo/issues/8355
        }
    },
    recoveredProps: _consumeRecoveryProps(),
};
//# sourceMappingURL=ExpoErrorRecovery.web.js.map