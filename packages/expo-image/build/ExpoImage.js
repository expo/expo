import React from 'react';
import { Image, requireNativeComponent, StyleSheet } from 'react-native';
const NativeExpoImage = requireNativeComponent('ExpoImage');
export default function ExpoImage({ source, style, ...props }) {
    const resolvedSource = Image.resolveAssetSource(source ?? {});
    let resolvedStyle = style;
    // When possible, pass through the intrinsic size of the asset to the Yoga layout
    // system. While this is also possible in native code, doing it here is more efficient
    // as the yoga node gets initialized with the correct size from the start.
    // In native code, there is a separation between the layout (shadow) nodes and
    // actual views. Views that update the intrinsic content-size in Yoga trigger
    // additional layout passes, which we want to prevent.
    if (!Array.isArray(resolvedSource)) {
        const { width, height } = resolvedSource;
        resolvedStyle = StyleSheet.flatten([{ width, height }, style]);
    }
    return <NativeExpoImage {...props} source={resolvedSource} style={resolvedStyle}/>;
}
//# sourceMappingURL=ExpoImage.js.map