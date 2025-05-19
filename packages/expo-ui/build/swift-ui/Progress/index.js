import { requireNativeView } from 'expo';
import { Host } from '../Host';
const NativeProgressView = requireNativeView('ExpoUI', 'ProgressView');
/**
 * `<CircularProgress>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function CircularProgressPrimitive(props) {
    return <NativeProgressView {...props} variant="circular"/>;
}
/**
 * `<LinearProgress>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function LinearProgressPrimitive(props) {
    return <NativeProgressView {...props} variant="linear"/>;
}
/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props) {
    return (<Host style={props.style} matchContents>
      <CircularProgressPrimitive {...props}/>
    </Host>);
}
/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props) {
    return (<Host style={props.style} matchContents>
      <LinearProgressPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map