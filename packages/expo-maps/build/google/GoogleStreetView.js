import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoGoogleStreetView');
export function StreetView(props) {
    return <NativeView {...props}/>;
}
//# sourceMappingURL=GoogleStreetView.js.map