import Constants from 'expo-constants';
import React from 'react';
import { StatusBar } from 'react-native';
import useColorScheme from './useColorScheme';
export default function ExpoStatusBar(props) {
    const { translucent: userTranslucent, backgroundColor: userBackgroundColor, barStyle: userBarStyle, ...otherProps } = props;
    // If the manifest is available and androidStatusBar is set in it, then base the
    // default value off of that. If it's not provided, we assume it is translucent.
    const defaultTranslucency = Constants.manifest?.androidStatusBar?.translucent ?? true;
    const translucent = userTranslucent ?? defaultTranslucency;
    // Pick appropriate 'default' depending on current theme, so if we are locked to light mode
    // we don't end up with a light status bar
    const colorScheme = useColorScheme();
    let barStyle = userBarStyle;
    // Only adapt the barStyle to the theme if the status bar is translucent. If it's opaque,
    // then therere will be some background color and we don't know how to adapt to that
    // automatically.
    if ((userBarStyle === 'default' || !userBarStyle) && translucent) {
        barStyle = colorScheme === 'light' ? 'dark-content' : 'light-content';
    }
    else if (!userBarStyle && !translucent) {
        barStyle = 'default';
    }
    let backgroundColor = userBackgroundColor;
    if (translucent) {
        if (userBackgroundColor === undefined) {
            // TODO: use manifest property for this?
            backgroundColor = 'transparent';
        }
    }
    return (React.createElement(StatusBar, Object.assign({ translucent: translucent, backgroundColor: backgroundColor, barStyle: barStyle }, otherProps)));
}
//# sourceMappingURL=ExpoStatusBar.android.js.map