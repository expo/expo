import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const LabelNativeView = requireNativeView('ExpoUI', 'LabelView');
/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function Label(props) {
    const { modifiers, ...restProps } = props;
    return (<LabelNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps}/>);
}
//# sourceMappingURL=index.js.map