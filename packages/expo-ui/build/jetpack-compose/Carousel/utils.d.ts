import { CarouselItemProps, CarouselProps, NativeCarouselProps } from './index';
export type CarouselElement = Omit<CarouselItemProps, 'onPress'>;
/**
 * Transforms Carousel props to native format, converting children to elements array
 * and setting up press event handling.
 */
export declare function transformCarouselProps(props: CarouselProps): NativeCarouselProps;
//# sourceMappingURL=utils.d.ts.map