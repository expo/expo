import React from 'react';
import { StatusBar } from 'react-native';
export default function ExpoStatusBar(props) {
    const { translucent, ...otherProps } = props;
    // Default status bar appearance is translucent in managed worklfow
    return React.createElement(StatusBar, Object.assign({ translucent: translucent ?? true }, otherProps));
}
//# sourceMappingURL=ExpoStatusBar.android.js.map