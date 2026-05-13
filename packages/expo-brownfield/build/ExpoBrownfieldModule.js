import { requireNativeModule } from 'expo';
const ExpoBrownfieldModule = requireNativeModule('ExpoBrownfieldModule');
// SECTION: Navigation API
/**
 * Navigates back to the native part of the app, dismissing the React Native view.
 *
 * @param animated Whether to animate the transition (iOS only). Defaults to `false`.
 * @default false
 */
export function popToNative(animated = false) {
    ExpoBrownfieldModule.popToNative(animated);
}
/**
 * Enables or disables the native back button behavior. When enabled, pressing the
 * back button will navigate back to the native part of the app instead of
 * performing the default React Navigation back action.
 *
 * @param enabled Whether to enable native back button handling.
 */
export function setNativeBackEnabled(enabled) {
    ExpoBrownfieldModule.setNativeBackEnabled(enabled);
}
// END SECTION: Navigation API
// SECTION: Messaging API
/**
 * Adds a listener for messages sent from the native side of the app.
 *
 * @param listener A callback function that receives message events from native.
 * @returns A subscription object that can be used to remove the listener.
 *
 * @example
 * ```ts
 * const subscription = addMessageListener((event) => {
 *   console.log('Received message from native:', event);
 * });
 *
 * // Later, to remove the listener:
 * subscription.remove();
 * ```
 */
export function addMessageListener(listener) {
    return ExpoBrownfieldModule.addListener('onMessage', listener);
}
/**
 * Sends a message to the native side of the app. The message can be received by
 * setting up a listener in the native code.
 *
 * @param message A dictionary containing the message payload to send to native.
 */
export function sendMessage(message) {
    ExpoBrownfieldModule.sendMessage(message);
}
/**
 * Removes a specific message listener.
 *
 * @param listener The listener function to remove.
 */
export function removeMessageListener(listener) {
    ExpoBrownfieldModule.removeListener('onMessage', listener);
}
/**
 * Removes all message listeners.
 */
export function removeAllMessageListeners() {
    ExpoBrownfieldModule.removeAllListeners('onMessage');
}
/**
 * Gets the number of registered message listeners.
 *
 * @returns The number of active message listeners.
 */
export function getMessageListenerCount() {
    return ExpoBrownfieldModule.listenerCount('onMessage');
}
// END SECTION: Messaging API
//# sourceMappingURL=ExpoBrownfieldModule.js.map