import { Children, isValidElement } from 'react';
import { CarouselItem } from './index';
/**
 * Transforms children to elements array for native component
 */
function transformChildrenToElements(children) {
    const elements = [];
    const onPressCallbacks = new Map();
    Children.toArray(children).forEach((child, index) => {
        if (isValidElement(child) && child.type === CarouselItem) {
            const props = child.props;
            elements.push({
                image: props.image,
                title: props.title,
                textColor: props.textColor,
                textStyle: props.textStyle,
                cornerRadius: props.cornerRadius,
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
export function transformCarouselProps(props) {
    const { children, ...restProps } = props;
    const { elements, onPressCallbacks } = transformChildrenToElements(children);
    // Create event handler for item press events
    const onItemPress = (event) => {
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
//# sourceMappingURL=utils.js.map