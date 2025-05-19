import { requireNativeView } from 'expo';
import { Host } from '../Host';
const PickerNativeView = requireNativeView('ExpoUI', 'PickerView');
/**
 * @hidden
 */
export function transformPickerProps(props) {
    return {
        ...props,
        variant: props.variant ?? 'segmented',
        color: props.color,
    };
}
/**
 * `<Picker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function PickerPrimitive(props) {
    return <PickerNativeView {...transformPickerProps(props)}/>;
}
/**
 * Displays a native picker component. Depending on the variant it can be a segmented button, an inline picker, a list of choices or a radio button.
 */
export function Picker(props) {
    return (<Host style={props.style} matchContents>
      <PickerPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map