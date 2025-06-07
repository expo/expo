import { requireNativeView } from 'expo';
import { Host } from '../Host';
const ShareLinkNativeView = requireNativeView('ExpoUI', 'ShareLinkView');
/**
 * `<ShareLink>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ShareLinkPrimitive(props) {
    return <ShareLinkNativeView {...props}/>;
}
/**
 * Renders the native ShareLink component with the provided properties.
 *
 * @param {ShareLinkProps} props - The properties passed to the ShareLink component.
 * @returns {JSX.Element} The rendered native ShareLink component.
 * @platform ios
 */
export function ShareLink(props) {
    return (<Host style={props.style} matchContents>
      <ShareLinkPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map