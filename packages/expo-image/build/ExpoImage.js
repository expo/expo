import React from 'react';
import { Image, requireNativeComponent } from 'react-native';
const NativeExpoImage = requireNativeComponent('ExpoImage');
export default function ExpoImage({ source, ...props }) {
    const resolvedSource = Image.resolveAssetSource(source ?? {});
    return <NativeExpoImage {...props} source={resolvedSource}/>;
}
//# sourceMappingURL=ExpoImage.js.map