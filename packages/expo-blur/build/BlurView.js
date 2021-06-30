import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { View, StyleSheet } from 'react-native';
export default class BlurView extends React.Component {
    render() {
        const { tint = 'default', intensity = 50, style, children, ...props } = this.props;
        return (React.createElement(View, { ...props, style: [styles.container, style] },
            React.createElement(NativeBlurView, { tint: tint, intensity: intensity, style: StyleSheet.absoluteFill }),
            children));
    }
}
const styles = StyleSheet.create({
    container: { backgroundColor: 'transparent' },
});
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
//# sourceMappingURL=BlurView.js.map