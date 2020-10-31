import { EventEmitter } from '@unimodules/core';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';
// We need any native module for EventEmitter
// to be able to be subscribed to.
const MockNativeModule = {
    addListener: () => { },
    removeListeners: () => { },
};
// Event emitter used solely for the purpose
// of distributing initial notification response
// to useInitialNotificationResponse hook
const eventEmitter = new EventEmitter(MockNativeModule);
const RESPONSE_EVENT_TYPE = 'response';
// Last notification response caught by
// global subscription
let lastNotificationResponse = undefined;
// An ever-running subscription, never cleared.
addNotificationResponseReceivedListener(response => {
    // Prepare initial value for new listeners
    lastNotificationResponse = response;
    // Inform existing listeners of a new value
    eventEmitter.emit(RESPONSE_EVENT_TYPE, response);
});
/**
 * Add listener to the ever-running shared response listener
 * @param listener Notification response listener
 */
export function addListener(listener) {
    return eventEmitter.addListener(RESPONSE_EVENT_TYPE, listener);
}
/**
 * Return a notification response most recently
 * caught by the ever-running shared response listener
 */
export function getLastNotificationResponse() {
    return lastNotificationResponse;
}
//# sourceMappingURL=SharedNotificationResponseListener.fx.js.map