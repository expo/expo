import React from 'react';
import { StatusBar } from 'react-native';
import styleToBarStyle from './styleToBarStyle';
import useColorScheme from './useColorScheme';
export default function ExpoStatusBar(props) {
    const { style, animated, hidden, hideTransitionAnimation, networkActivityIndicatorVisible } = props;
    const showHideTransition = hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation;
    // Pick appropriate default value depending on current theme, so if we are
    // locked to light mode we don't end up with a light status bar
    const colorScheme = useColorScheme();
    const barStyle = styleToBarStyle(style, colorScheme);
    return (React.createElement(StatusBar, { barStyle: barStyle, animated: animated, hidden: hidden, networkActivityIndicatorVisible: networkActivityIndicatorVisible, showHideTransition: showHideTransition }));
}
//# sourceMappingURL=ExpoStatusBar.ios.js.map