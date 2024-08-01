import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import styleToBarStyle from './styleToBarStyle';
export default function ExpoStatusBar(props) {
    const { style, animated, hidden, backgroundColor: backgroundColorProp, translucent: translucentProp, } = props;
    // Default to true for translucent
    const translucent = translucentProp ?? true;
    // Pick appropriate default value depending on current theme, so if we are
    // locked to light mode we don't end up with a light status bar
    const colorScheme = useColorScheme();
    const barStyle = styleToBarStyle(style, colorScheme);
    // If translucent and no backgroundColor is provided, then use transparent
    // background
    let backgroundColor = backgroundColorProp;
    if (translucent && !backgroundColor) {
        backgroundColor = 'transparent';
    }
    return (<StatusBar translucent={translucent} barStyle={barStyle} backgroundColor={backgroundColor} animated={animated} hidden={hidden}/>);
}
//# sourceMappingURL=ExpoStatusBar.android.js.map