import React from 'react';
import { Appearance, StatusBar } from 'react-native';
export default function ExpoStatusBar(props) {
    let { barStyle, ...otherProps } = props;
    // Pick appropriate 'default' depending on current theme, so if we are locked to light mode
    // we don't end up with a light status bar
    if (props.barStyle === 'default') {
        barStyle = Appearance.getColorScheme() === 'light' ? 'dark-content' : 'light-content';
    }
    return React.createElement(StatusBar, Object.assign({ barStyle: barStyle }, otherProps));
}
//# sourceMappingURL=ExpoStatusBar.ios.js.map