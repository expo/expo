import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from '@unimodules/core';
const { ExponentNotifications } = NativeModulesProxy;
const DeviceEventEmitter = new NativeEventEmitter(ExponentNotifications);
export class Mailbox {
    constructor() {
        this.onUserInteractionListeners = new Map();
        this.onForegroundNotificationListeners = new Map();
        this.onTokenChangeListener = null;
        DeviceEventEmitter.addListener('Exponent.onUserInteraction', this.onUserInteraction.bind(this));
        DeviceEventEmitter.addListener('Exponent.onForegroundNotification', this.onForegroundNotification.bind(this));
        DeviceEventEmitter.addListener('Exponent.onTokenChange', this.onTokenChange.bind(this));
    }
    addOnUserInteractionListener(listenerName, listener) {
        this.onUserInteractionListeners.set(listenerName, listener);
    }
    addOnForegroundNotificationListener(listenerName, listener) {
        this.onForegroundNotificationListeners.set(listenerName, listener);
    }
    removeOnUserInteractionListener(listenerName) {
        this.onUserInteractionListeners.delete(listenerName);
    }
    removeOnForegroundNotificationListener(listenerName) {
        this.onForegroundNotificationListeners.delete(listenerName);
    }
    setOnTokenChangeListener(onTokenChangeListner) {
        this.onTokenChangeListener = onTokenChangeListner;
    }
    onForegroundNotification(notification) {
        for (let listener of this.onForegroundNotificationListeners.values()) {
            listener(notification);
        }
    }
    onUserInteraction(userInteraction) {
        for (let listener of this.onUserInteractionListeners.values()) {
            listener(userInteraction);
        }
    }
    onTokenChange(tokenMessage) {
        if (this.onTokenChangeListener != null) {
            this.onTokenChangeListener(tokenMessage.token);
        }
    }
}
//# sourceMappingURL=Mailbox.js.map