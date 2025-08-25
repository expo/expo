import { requireNativeView } from 'expo';
import React from 'react';
import { transformCarouselProps } from './utils';
const CarouselViewNative = requireNativeView('ExpoUI', 'CarouselView');
/**
 * Individual carousel item component
 */
export function CarouselItem(props) {
    // This component is used for type checking and transformation
    // The actual rendering happens on the native side
    return React.createElement('CarouselItem', props);
}
export function Carousel(props) {
    return <CarouselViewNative {...transformCarouselProps(props)}/>;
}
//# sourceMappingURL=index.js.map