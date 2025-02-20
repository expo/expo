import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';
let NativeView = null;
if (Platform.OS === 'android') {
    NativeView = requireNativeView('ExpoGoogleStreetView');
}
/**
 * @platform android
 */
export function GoogleStreetView(props) {
    if (!NativeView) {
        return null;
    }
    return <NativeView {...props}/>;
}
//# sourceMappingURL=GoogleStreetView.js.map