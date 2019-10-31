import { OnUserInteractionListener, OnForegroundNotificationListener, OnTokenChangeListener } from './Notifications.types';
export declare class Mailbox {
    private onUserInteractionListeners;
    private onForegroundNotificationListeners;
    private onTokenChangeListener;
    constructor();
    addOnUserInteractionListener(listenerName: string, listener: OnUserInteractionListener): void;
    addOnForegroundNotificationListener(listenerName: string, listener: OnForegroundNotificationListener): void;
    removeOnUserInteractionListener(listenerName: string): void;
    removeOnForegroundNotificationListener(listenerName: string): void;
    setOnTokenChangeListener(onTokenChangeListner: OnTokenChangeListener): void;
    private onForegroundNotification;
    private onUserInteraction;
    private onTokenChange;
}
