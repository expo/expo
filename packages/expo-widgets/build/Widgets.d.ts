import { type EventSubscription } from 'expo-modules-core';
import type { ExpoWidgetsEvents, LiveActivityComponent, LiveActivityDismissalPolicy, NativeLiveActivity, PushTokenEvent, WidgetBase, WidgetTimelineEntry } from './Widgets.types';
/**
 * Represents a widget instance. Provides methods to manage the widget's timeline.
 */
export declare class Widget<T extends object = object> {
    /** @hidden */
    private nativeWidgetObject;
    constructor(name: string, layout: (p: WidgetBase<T>) => React.JSX.Element);
    /**
     * Force reloads the widget, causing it to refresh its content and timeline.
     */
    reload(): void;
    /**
     * Schedules a series of updates for the widget's content and reloads the widget.
     * @param entries Timeline entries, each specifying a date and the props to display at that time.
     */
    updateTimeline(entries: WidgetTimelineEntry<T>[]): void;
    /**
     * Sets the widget's content to the given props immediately, without scheduling a timeline.
     * @param props The properties to display in the widget.
     */
    updateSnapshot(props: T): void;
    /**
     * Returns the current timeline entries for the widget, including past and future entries.
     */
    getTimeline(): Promise<WidgetTimelineEntry<T>[]>;
}
/**
 * Represents a Live Activity instance. Provides methods to update its content and end it.
 */
export declare class LiveActivity<T extends object = object> {
    /** @hidden */
    private nativeLiveActivity;
    constructor(nativeLiveActivity: NativeLiveActivity);
    /**
     * Updates the Live Activity's content. The UI reflects the new properties immediately.
     * @param props The updated content properties.
     */
    update(props: T): Promise<void>;
    /**
     * Ends the Live Activity.
     * @param dismissalPolicy Controls when the Live Activity is removed from the Lock Screen after ending.
     * Can be `'default'`, `'immediate'`, or `after(date)`.
     * @param props Final content properties to update after the activity ends.
     * @param contentDate The time the data in the payload was generated. If this is older than a previous update or push payload, the system ignores this update.
     */
    end(dismissalPolicy?: LiveActivityDismissalPolicy, props?: T, contentDate?: Date): Promise<void>;
    /**
     * Returns the push token for this Live Activity, used to send push notification updates via APNs.
     * Returns `null` if push notifications are not enabled or the token is not yet available.
     */
    getPushToken(): Promise<string | null>;
    /**
     * Adds a listener for push token update events on this Live Activity instance.
     * The token can be used to send content updates to this specific activity via APNs.
     * @param listener Callback invoked when a new push token is available.
     * @returns An event subscription that can be used to remove the listener.
     */
    addPushTokenListener(listener: (event: PushTokenEvent) => void): EventSubscription;
}
/**
 * Manages Live Activity instances of a specific type. Use it to start new activities and retrieve currently active ones.
 */
export declare class LiveActivityFactory<T extends object = object> {
    /** @hidden */
    private nativeLiveActivityFactory;
    constructor(name: string, layout: LiveActivityComponent<T>);
    /**
     * Starts a new Live Activity with the given properties.
     * @param props The initial content properties for the Live Activity.
     * @param url An optional URL to associate with the Live Activity, used for deep linking.
     * @returns The new Live Activity instance.
     */
    start(props: T, url?: string): LiveActivity<T>;
    /**
     * Returns all currently active instances of this Live Activity type.
     */
    getInstances(): LiveActivity<T>[];
}
/**
 * Creates a dismissal policy that removes the Live Activity at the specified time within a four-hour window.
 * @param date The date after which the Live Activity should be removed from the Lock Screen.
 * @hidden
 */
export declare function after(date: Date): {
    after: Date;
};
/**
 * Creates a Widget instance.
 * @param name The widget name. Must match the `'name'` field in your widget configuration in the app config.
 * @param widget The widget component, marked with the `'widget'` directive.
 */
export declare function createWidget<T extends object = object>(name: string, widget: (props: WidgetBase<T>) => React.JSX.Element): Widget<T>;
/**
 * Creates a Live Activity Factory for managing Live Activities of a specific type.
 * @param name The Live Activity name. Must match the `'name'` field in your widget configuration in the app config.
 * @param liveActivity The Live Activity component, marked with the `'widget'` directive.
 */
export declare function createLiveActivity<T extends object = object>(name: string, liveActivity: LiveActivityComponent<T>): LiveActivityFactory<T>;
/**
 * Adds a listener for widget interaction events (for example, button taps).
 * @param listener Callback function to handle user interaction events.
 * @return An event subscription that can be used to remove the listener.
 */
export declare function addUserInteractionListener(listener: ExpoWidgetsEvents['onExpoWidgetsUserInteraction']): EventSubscription;
/**
 * Adds a listener for push-to-start token events.
 * This token can be used to start live activities remotely via APNs.
 * @param listener Callback function to handle push-to-start token events.
 * @return An event subscription that can be used to remove the listener.
 */
export declare function addPushToStartTokenListener(listener: ExpoWidgetsEvents['onExpoWidgetsPushToStartTokenReceived']): EventSubscription;
//# sourceMappingURL=Widgets.d.ts.map