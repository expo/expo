import React from 'react';
import { Image } from 'react-native';
export default function ExpoImage({ source, ...props }) {
    const resolvedSource = source ?? {};
    // @ts-ignore - this is being fixed in the near future anyways
    return React.createElement(Image, { ...props, source: resolvedSource });
}
//# sourceMappingURL=ExpoImage.web.js.map