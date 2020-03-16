import React from 'react';
import { Image } from 'react-native';
// For now let's set a default resize mode
// which makes the result image the same on all platforms.
const DEFAULT_RESIZE_MODE = 'stretch';
export default function ExpoImage({ source, ...props }) {
    const resolvedSource = source ?? {};
    return <Image resizeMode={DEFAULT_RESIZE_MODE} {...props} source={resolvedSource}/>;
}
//# sourceMappingURL=ExpoImage.web.js.map