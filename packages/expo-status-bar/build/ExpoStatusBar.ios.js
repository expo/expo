import React from 'react';
import { useColorScheme as maybeUseColorScheme, StatusBar } from 'react-native';
if (!maybeUseColorScheme) {
    console.warn('expo-status-bar is only supported on Expo SDK >= 38 and React Native >= 0.62. You are seeing this message because useColorScheme from react-native is not available. Some features may not work as expected.');
}
const fallbackUseColorScheme = () => 'light';
const useColorScheme = maybeUseColorScheme ?? fallbackUseColorScheme;
export default function ExpoStatusBar(props) {
    let { barStyle, ...otherProps } = props;
    const colorScheme = useColorScheme();
    // Pick appropriate 'default' depending on current theme, so if we are locked to light mode
    // we don't end up with a light status bar
    if (props.barStyle === 'default') {
        barStyle = colorScheme === 'light' ? 'dark-content' : 'light-content';
    }
    return React.createElement(StatusBar, Object.assign({ barStyle: barStyle }, otherProps));
}
//# sourceMappingURL=ExpoStatusBar.ios.js.map