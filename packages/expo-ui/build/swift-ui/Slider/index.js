import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const SliderNativeView = requireNativeView('ExpoUI', 'SliderView');
function transformSliderProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        min: props.min ?? 0,
        max: props.max ?? 1,
        steps: props.steps ?? 0,
        value: props.value ?? 0,
        onValueChanged: ({ nativeEvent: { value } }) => {
            props?.onValueChange?.(value);
        },
        color: props.color,
    };
}
export function Slider(props) {
    return <SliderNativeView {...transformSliderProps(props)}/>;
}
//# sourceMappingURL=index.js.map