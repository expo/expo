import { requireNativeView } from 'expo';
/**
 * Possible durations for the Snackbar.
 */
export var SnackbarDuration;
(function (SnackbarDuration) {
    /**
     * Show the Snackbar indefinitely until explicitly dismissed or action is clicked.
     */
    SnackbarDuration["Indefinite"] = "indefinite";
    /**
     * Show the Snackbar for a long period of time.
     */
    SnackbarDuration["Long"] = "long";
    /**
     * Show the Snackbar for a short period of time.
     */
    SnackbarDuration["Short"] = "short";
})(SnackbarDuration || (SnackbarDuration = {}));
const SnackbarNativeView = requireNativeView('ExpoUI', 'SnackbarView');
/**
 * Renders a `Snackbar` component.
 */
export function Snackbar(props) {
    return <SnackbarNativeView {...props}/>;
}
//# sourceMappingURL=index.js.map