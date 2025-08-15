import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const ShareLinkNativeView = requireNativeView('ExpoUI', 'ShareLinkView');
/**
 * Renders the native ShareLink component with the provided properties.
 *
 * @param {ShareLinkProps} props - The properties passed to the ShareLink component.
 * @returns {JSX.Element} The rendered native ShareLink component.
 * @platform ios
 */
export function ShareLink(props) {
    const { modifiers, ...restProps } = props;
    return (<ShareLinkNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps}/>);
}
//# sourceMappingURL=index.js.map