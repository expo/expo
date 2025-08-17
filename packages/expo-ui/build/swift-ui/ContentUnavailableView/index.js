import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const ContentUnavailableViewNativeView = requireNativeView('ExpoUI', 'ContentUnavailableView');
/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 */
function transformContentUnavailableViewProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
    };
}
export function ContentUnavailableView(props) {
    return <ContentUnavailableViewNativeView {...transformContentUnavailableViewProps(props)}/>;
}
//# sourceMappingURL=index.js.map