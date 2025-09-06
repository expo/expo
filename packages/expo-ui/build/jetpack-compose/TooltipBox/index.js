import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
const TooltipBoxNativeView = Platform.OS === 'android' ? requireNativeView('ExpoUI', 'TooltipBox') : null;
/**
 * Use tooltips to add context to a button or other UI element.
 */
export function TooltipBox(props) {
    if (!TooltipBoxNativeView) {
        return null;
    }
    return <TooltipBoxNativeView {...props}/>;
}
//# sourceMappingURL=index.js.map