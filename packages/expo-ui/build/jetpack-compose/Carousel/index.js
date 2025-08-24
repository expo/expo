import { requireNativeView } from 'expo';
import React from 'react';
const CarouselViewNative = requireNativeView('ExpoUI', 'CarouselView');
export function Carousel(props) {
    return <CarouselViewNative {...props}/>;
}
//# sourceMappingURL=index.js.map