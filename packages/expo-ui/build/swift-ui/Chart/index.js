import { requireNativeView } from 'expo';
import { Host } from '../Host';
const ChartNativeView = requireNativeView('ExpoUI', 'ChartView');
/**
 * `<Chart>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ChartPrimitive({ data, ...props }) {
    return <ChartNativeView data={data} {...props}/>;
}
/**
 * Renders a native Chart component using Swift Charts.
 * @platform ios
 */
export function Chart({ style, data, ...props }) {
    return (<Host style={style}>
      <ChartPrimitive data={data} {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map