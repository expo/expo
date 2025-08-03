import { requireNativeView } from 'expo';
import { Host } from '../Host';
const ChartNativeView = requireNativeView('ExpoUI', 'ChartView');
/**
 * `<Chart>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ChartPrimitive({ type = 'line', showGrid = true, animate = true, showLegend = false, data, ...props }) {
    return (<ChartNativeView type={type} showGrid={showGrid} animate={animate} showLegend={showLegend} data={data} {...props}/>);
}
/**
 * Renders a native Chart component using Swift Charts.
 * @platform ios
 */
export function Chart(props) {
    return (<Host style={props.style}>
      <ChartPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map