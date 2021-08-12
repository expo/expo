import React from 'react';
import { Image } from 'react-native';
export default function ExpoImage({ source, ...props }) {
    const resolvedSource = source ?? {};
    // @ts-expect-error - expo-image is being reworked so these types should be revisited
    return React.createElement(Image, { ...props, source: resolvedSource });
}
//# sourceMappingURL=ExpoImage.web.js.map