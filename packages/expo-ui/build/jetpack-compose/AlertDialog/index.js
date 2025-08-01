import { requireNativeView } from 'expo';
const AlertDialogNativeView = requireNativeView('ExpoUI', 'AlertDialogView');
/**
 * Renders an `AlertDialog` component.
 */
export function AlertDialog(props) {
    return <AlertDialogNativeView {...props}/>;
}
//# sourceMappingURL=index.js.map