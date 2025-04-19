import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
let GaugeNativeView;
if (Platform.OS === 'ios') {
    GaugeNativeView = requireNativeView('ExpoUI', 'GaugeView');
}
/**
 * Renders a native `Gauge` component.
 * @platform ios
 */
export function Gauge({ type = 'default', ...props }) {
    if (!GaugeNativeView) {
        return null;
    }
    return <GaugeNativeView type={type} {...props}/>;
}
//# sourceMappingURL=index.js.map