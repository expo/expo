import { requireNativeView } from 'expo';
import { isMissingHost, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const SwitchNativeView = requireNativeView('ExpoUI', 'SwitchView');
function transformSwitchProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        variant: props.variant ?? 'switch',
        color: props.color,
        onValueChange: ({ nativeEvent: { value } }) => {
            props?.onValueChange?.(value);
        },
    };
}
/**
 * Displays a native switch component.
 */
export function Switch(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Switch"/>;
    }
    return <SwitchNativeView {...transformSwitchProps(props)}/>;
}
//# sourceMappingURL=index.js.map