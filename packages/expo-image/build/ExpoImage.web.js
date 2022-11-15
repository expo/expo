import React from 'react';
import { Image } from 'react-native';
export default function ExpoImage({ source, ...props }) {
    const resolvedSource = source ?? {};
    return React.createElement(Image, { ...props, source: resolvedSource });
}
//# sourceMappingURL=ExpoImage.web.js.map