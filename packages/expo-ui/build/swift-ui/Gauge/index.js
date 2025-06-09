import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
import { Host } from '../Host';
let GaugeNativeView;
if (Platform.OS === 'ios') {
    GaugeNativeView = requireNativeView('ExpoUI', 'GaugeView');
}
/**
 * `<Gauge>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function GaugePrimitive({ type = 'default', ...props }) {
    if (!GaugeNativeView) {
        return null;
    }
    return <GaugeNativeView type={type} {...props}/>;
}
/**
 * Renders a native `Gauge` component.
 * @platform ios
 */
export function Gauge(props) {
    return (<Host style={props.style} matchContents>
      <GaugePrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map