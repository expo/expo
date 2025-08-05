import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
import { createViewModifierEventListener } from './modifiers/utils';
const ContentUnavailableViewNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'ContentUnavailableView') : null;
/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 *
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
    if (!ContentUnavailableViewNativeView) {
        return null;
    }
    return <ContentUnavailableViewNativeView {...transformContentUnavailableViewProps(props)}/>;
}
//# sourceMappingURL=ContentUnavailableView.js.map