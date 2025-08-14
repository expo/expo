import { requireNativeView } from 'expo';
const SwitchNativeView = requireNativeView('ExpoUI', 'SwitchView');
function getElementColors(props) {
    if (props.variant === 'button') {
        return undefined;
    }
    if (!props.elementColors) {
        if (props.variant === 'switch') {
            return {
                checkedTrackColor: props.color,
            };
        }
        else {
            return {
                checkedColor: props.color,
            };
        }
    }
    return props.elementColors;
}
/**
 * @hidden
 */
export function transformSwitchProps(props) {
    return {
        ...props,
        variant: props.variant ?? 'switch',
        elementColors: getElementColors(props),
        color: props.color,
        onValueChange: ({ nativeEvent: { value } }) => {
            props?.onValueChange?.(value);
        },
        // @ts-expect-error
        modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
    };
}
export function Switch(props) {
    return <SwitchNativeView {...transformSwitchProps(props)}/>;
}
//# sourceMappingURL=index.js.map