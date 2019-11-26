import { OnUserInteractionListener, OnForegroundNotificationListener, OnTokenChangeListener, Subscription } from './Notifications.types';
export declare class Mailbox {
    private onUserInteractionListeners;
    private onForegroundNotificationListeners;
    private onTokenChangeListener;
    private lastId;
    constructor();
    getNextId(): number;
    createSubscription<T>(id: number, map: Map<number, T>): Subscription;
    addOnUserInteractionListener(listener: OnUserInteractionListener): Subscription;
    addOnForegroundNotificationListener(listener: OnForegroundNotificationListener): Subscription;
    setOnTokenChangeListener(onTokenChangeListner: OnTokenChangeListener): void;
    private onForegroundNotification;
    private onUserInteraction;
    private onTokenChange;
}
