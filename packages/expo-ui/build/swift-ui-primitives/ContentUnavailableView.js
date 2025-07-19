import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
const ContentUnavailableViewNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'ContentUnavailableView') : null;
/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 *
 */
export function ContentUnavailableView(props) {
    if (!ContentUnavailableViewNativeView) {
        return null;
    }
    return <ContentUnavailableViewNativeView {...props}/>;
}
//# sourceMappingURL=ContentUnavailableView.js.map