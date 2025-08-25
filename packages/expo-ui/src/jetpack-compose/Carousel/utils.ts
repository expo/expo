import { Children, isValidElement, ReactNode } from 'react';

import { CarouselItem, CarouselItemProps, CarouselProps, NativeCarouselProps } from './index';

export type CarouselElement = Omit<CarouselItemProps, 'onPress'>;

/**
 * Transforms children to elements array for native component
 */
function transformChildrenToElements(children: ReactNode): {
  elements: CarouselElement[];
  onPressCallbacks: Map<number, (index: number) => void>;
} {
  const elements: CarouselElement[] = [];
  const onPressCallbacks = new Map<number, (index: number) => void>();

  Children.toArray(children).forEach((child, index) => {
    if (isValidElement(child) && child.type === CarouselItem) {
      const props = child.props as CarouselItemProps;
      elements.push({
        image: props.image,
        title: props.title,
        textColor: props.textColor,
        textStyle: props.textStyle,
        cornerRadius: props.cornerRadius,
        height: props.height,
      });

      if (props.onPress) {
        onPressCallbacks.set(index, props.onPress);
      }
    }
  });

  return { elements, onPressCallbacks };
}

/**
 * Transforms Carousel props to native format, converting children to elements array
 * and setting up press event handling.
 */
export function transformCarouselProps(props: CarouselProps): NativeCarouselProps {
  const { children, ...restProps } = props;

  const { elements, onPressCallbacks } = transformChildrenToElements(children);

  // Create event handler for item press events
  const onItemPress = (event: { nativeEvent: { index: number } }) => {
    const index = event.nativeEvent.index;
    const onPress = onPressCallbacks.get(index);
    if (onPress) {
      onPress(index);
    }
  };

  return {
    ...restProps,
    elements,
    onItemPress,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}
