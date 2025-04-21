import { requireNativeView } from 'expo';
const SwitchNativeView = requireNativeView('ExpoUI', 'SwitchView');
/**
 * @hidden
 */
export function transformSwitchProps(props) {
    return {
        ...props,
        variant: props.variant ?? 'switch',
        color: props.color,
        onValueChange: ({ nativeEvent: { value } }) => {
            props?.onValueChange?.(value);
        },
    };
}
export function Switch(props) {
    return <SwitchNativeView {...transformSwitchProps(props)}/>;
}
//# sourceMappingURL=index.js.map