import { requireNativeView } from 'expo';
const AlertDialogNativeView = requireNativeView('ExpoUI', 'AlertDialogView');
/**
 * Renders an `AlertDialog` component.
 */
export function AlertDialog(props) {
    return (<AlertDialogNativeView {...props} 
    // @ts-expect-error
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}/>);
}
//# sourceMappingURL=index.js.map