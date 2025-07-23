import { requireNativeView } from 'expo';
const SliderNativeView = requireNativeView('ExpoUI', 'SliderView');
/**
 * @hidden
 */
export function transformSliderProps(props) {
    return {
        ...props,
        min: props.min ?? 0,
        max: props.max ?? 1,
        steps: props.steps ?? 0,
        value: props.value ?? 0,
        onValueChanged: ({ nativeEvent: { value } }) => {
            props?.onValueChange?.(value);
        },
        elementColors: props.elementColors
            ? props.elementColors
            : props.color
                ? {
                    thumbColor: props.color,
                    activeTrackColor: props.color,
                    activeTickColor: props.color,
                }
                : undefined,
        color: props.color,
    };
}
export function Slider(props) {
    return <SliderNativeView {...transformSliderProps(props)}/>;
}
//# sourceMappingURL=index.js.map