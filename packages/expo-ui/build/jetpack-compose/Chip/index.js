import { requireNativeView } from 'expo';
import React from 'react';
import { StyleSheet } from 'react-native';
// Native component declaration using the same pattern as Button
const ChipNativeView = requireNativeView('ExpoUI', 'ChipView');
/**
 * Displays a native chip component.
 */
export function Chip(props) {
    // Min height from https://m3.material.io/components/chips/specs, minWidth
    return (<ChipNativeView {...props} style={StyleSheet.compose({ minWidth: 100, height: 32 }, props.style)}/>);
}
//# sourceMappingURL=index.js.map