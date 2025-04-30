import { requireNativeView } from 'expo';
import { Host } from '../Host';
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
/**
 * `<Switch>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function SwitchPrimitive(props) {
    return <SwitchNativeView {...transformSwitchProps(props)}/>;
}
/**
 * Displays a native switch component.
 */
export function Switch(props) {
    return (<Host style={props.style} matchContents>
      <SwitchPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map