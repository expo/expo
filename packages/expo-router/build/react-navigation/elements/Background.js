'use client';
import * as React from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../native';
export function Background({ style, ...rest }) {
    const { colors } = useTheme();
    return (<Animated.View {...rest} style={[{ flex: 1, backgroundColor: colors.background }, style]}/>);
}
//# sourceMappingURL=Background.js.map