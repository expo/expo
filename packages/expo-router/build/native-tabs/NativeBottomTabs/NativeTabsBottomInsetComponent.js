"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsBottomInsetComponent = NativeTabsBottomInsetComponent;
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const isSupported = process.env.EXPO_OS === 'android';
/**
 * This is not ideal, but seems to work
 *
 * The value is hardcoded based on https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/bottomnavigation/res/values/dimens.xml#L22
 */
function NativeTabsBottomInsetComponent({ isActive }) {
    const inset = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    if (isSupported && isActive) {
        return <react_native_1.View style={{ height: 56 + inset.bottom, width: '100%', backgroundColor: '#f00' }}/>;
    }
    return null;
}
//# sourceMappingURL=NativeTabsBottomInsetComponent.js.map