import { addNotificationResponseReceivedListener } from './NotificationsEmitter';
// Last notification response caught by
// global subscription
let lastNotificationResponse = undefined;
// An ever-running subscription, never cleared.
addNotificationResponseReceivedListener(response => {
    // Prepare initial value for new listeners
    lastNotificationResponse = response;
});
/**
 * Return a notification response most recently
 * caught by the ever-running shared response listener
 */
export function getLastNotificationResponse() {
    return lastNotificationResponse;
}
//# sourceMappingURL=SharedNotificationResponseListener.fx.js.map