import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from '@unimodules/core';
const { ExpoNotifications } = NativeModulesProxy;
const DeviceEventEmitter = new NativeEventEmitter(ExpoNotifications);
export class Mailbox {
    constructor() {
        this.lastId = 0;
        this.onUserInteractionListeners = new Map();
        this.onForegroundNotificationListeners = new Map();
        this.onTokenChangeListener = null;
        DeviceEventEmitter.addListener('Expo.onUserInteraction', this.onUserInteraction.bind(this));
        DeviceEventEmitter.addListener('Expo.onForegroundNotification', this.onForegroundNotification.bind(this));
        DeviceEventEmitter.addListener('Expo.onTokenChange', this.onTokenChange.bind(this));
    }
    getNextId() {
        return this.lastId++;
    }
    createSubscription(id, map) {
        return {
            remove() {
                map.delete(id);
            }
        };
    }
    addOnUserInteractionListener(listener) {
        const id = this.lastId;
        this.onUserInteractionListeners.set(id, listener);
        return this.createSubscription(id, this.onUserInteractionListeners);
    }
    addOnForegroundNotificationListener(listener) {
        const id = this.lastId;
        this.onForegroundNotificationListeners.set(id, listener);
        return this.createSubscription(id, this.onForegroundNotificationListeners);
    }
    setOnTokenChangeListener(onTokenChangeListner) {
        this.onTokenChangeListener = onTokenChangeListner;
    }
    async onForegroundNotification(notification) {
        for (let listener of this.onForegroundNotificationListeners.values()) {
            await listener(notification);
        }
    }
    async onUserInteraction(userInteraction) {
        for (let listener of this.onUserInteractionListeners.values()) {
            await listener(userInteraction);
        }
    }
    async onTokenChange(tokenMessage) {
        if (this.onTokenChangeListener != null) {
            await this.onTokenChangeListener(tokenMessage.token);
        }
    }
}
//# sourceMappingURL=Mailbox.js.map