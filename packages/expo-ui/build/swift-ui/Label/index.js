import { requireNativeView } from 'expo';
import { Host } from '../Host';
const LabelNativeView = requireNativeView('ExpoUI', 'LabelView');
/**
 * `<Label>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function LabelPrimitive(props) {
    return <LabelNativeView {...props}/>;
}
/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function Label(props) {
    return (<Host style={props.style} matchContents>
      <LabelPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map