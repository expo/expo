import { requireNativeView } from 'expo';
const NativeProgressView = requireNativeView('ExpoUI', 'ProgressView');
/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props) {
    return <NativeProgressView {...props} variant="circular"/>;
}
/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props) {
    return <NativeProgressView {...props} variant="linear"/>;
}
//# sourceMappingURL=index.js.map