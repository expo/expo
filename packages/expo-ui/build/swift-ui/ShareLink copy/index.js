import { requireNativeView } from 'expo';
import { Host } from '../Host';
const ShareLinkNativeView = requireNativeView('ExpoUI', 'ShareLinkView');
/**
 * `<Label>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ShareLinkPrimitive(props) {
    return <ShareLinkNativeView {...props}/>;
}
/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {ShareLinkProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function ShareLInk(props) {
    return (<Host style={props.style} matchContents>
      <ShareLinkPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map