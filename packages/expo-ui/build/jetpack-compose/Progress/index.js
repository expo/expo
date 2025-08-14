import { requireNativeView } from 'expo';
const NativeProgressView = requireNativeView('ExpoUI', 'ProgressView');
/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props) {
    return (<NativeProgressView {...props} // @ts-expect-error
     modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)} variant="circular"/>);
}
/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props) {
    return (<NativeProgressView {...props} // @ts-expect-error
     modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)} variant="linear"/>);
}
//# sourceMappingURL=index.js.map