import ExpoWidgetsModule from './ExpoWidgets';
/**
 * Represents a widget instance. Provides methods to manage the widget's timeline.
 */
export class Widget {
    /** @hidden */
    nativeWidgetObject;
    constructor(name, layout) {
        this.nativeWidgetObject = new ExpoWidgetsModule.Widget(name, layout);
    }
    /**
     * Force reloads the widget, causing it to refresh its content and timeline.
     */
    reload() {
        this.nativeWidgetObject.reload();
    }
    /**
     * Schedules a series of updates for the widget's content and reloads the widget.
     * @param entries Timeline entries, each specifying a date and the props to display at that time.
     */
    updateTimeline(entries) {
        this.nativeWidgetObject.updateTimeline(entries.map((entry) => ({ timestamp: entry.date.getTime(), props: entry.props })));
    }
    /**
     * Sets the widget's content to the given props immediately, without scheduling a timeline.
     * @param props The properties to display in the widget.
     */
    updateSnapshot(props) {
        this.nativeWidgetObject.updateTimeline([{ timestamp: Date.now(), props }]);
    }
    /**
     * Returns the current timeline entries for the widget, including past and future entries.
     */
    async getTimeline() {
        return (await this.nativeWidgetObject.getTimeline()).map((entry) => ({
            date: new Date(entry.timestamp),
            props: entry.props,
        }));
    }
}
/**
 * Represents a Live Activity instance. Provides methods to update its content and end it.
 */
export class LiveActivity {
    /** @hidden */
    nativeLiveActivity;
    constructor(nativeLiveActivity) {
        this.nativeLiveActivity = nativeLiveActivity;
    }
    /**
     * Updates the Live Activity's content. The UI reflects the new properties immediately.
     * @param props The updated content properties.
     */
    update(props) {
        return this.nativeLiveActivity.update(JSON.stringify(props));
    }
    /**
     * Ends the Live Activity.
     * @param dismissalPolicy Controls when the Live Activity is removed from the Lock Screen after ending.
     */
    end(dismissalPolicy) {
        return this.nativeLiveActivity.end(dismissalPolicy);
    }
    /**
     * Returns the push token for this Live Activity, used to send push notification updates via APNs.
     * Returns `null` if push notifications are not enabled or the token is not yet available.
     */
    getPushToken() {
        return this.nativeLiveActivity.getPushToken();
    }
    /**
     * Adds a listener for push token update events on this Live Activity instance.
     * The token can be used to send content updates to this specific activity via APNs.
     * @param listener Callback invoked when a new push token is available.
     * @returns An event subscription that can be used to remove the listener.
     */
    addPushTokenListener(listener) {
        return this.nativeLiveActivity.addListener('onExpoWidgetsTokenReceived', listener);
    }
}
/**
 * Manages Live Activity instances of a specific type. Use it to start new activities and retrieve currently active ones.
 */
export class LiveActivityFactory {
    /** @hidden */
    nativeLiveActivityFactory;
    constructor(name, layout) {
        this.nativeLiveActivityFactory = new ExpoWidgetsModule.LiveActivityFactory(name, layout);
    }
    /**
     * Starts a new Live Activity with the given properties.
     * @param props The initial content properties for the Live Activity.
     * @param url An optional URL to associate with the Live Activity, used for deep linking.
     * @returns The new Live Activity instance.
     */
    start(props, url) {
        return new LiveActivity(this.nativeLiveActivityFactory.start(JSON.stringify(props), url));
    }
    /**
     * Returns all currently active instances of this Live Activity type.
     */
    getInstances() {
        return this.nativeLiveActivityFactory
            .getInstances()
            .map((instance) => new LiveActivity(instance));
    }
}
/**
 * Creates a Widget instance.
 * @param name The widget name. Must match the `'name'` field in your widget configuration in the app config.
 * @param widget The widget component, marked with the `'widget'` directive.
 */
export function createWidget(name, widget) {
    return new Widget(name, widget);
}
/**
 * Creates a Live Activity Factory for managing Live Activities of a specific type.
 * @param name The Live Activity name. Must match the `'name'` field in your widget configuration in the app config.
 * @param liveActivity The Live Activity component, marked with the `'widget'` directive.
 */
export function createLiveActivity(name, liveActivity) {
    return new LiveActivityFactory(name, liveActivity);
}
/**
 * Adds a listener for widget interaction events (for example, button taps).
 * @param listener Callback function to handle user interaction events.
 * @return An event subscription that can be used to remove the listener.
 */
export function addUserInteractionListener(listener) {
    return ExpoWidgetsModule.addListener('onExpoWidgetsUserInteraction', listener);
}
/**
 * Adds a listener for push-to-start token events.
 * This token can be used to start live activities remotely via APNs.
 * @param listener Callback function to handle push-to-start token events.
 * @return An event subscription that can be used to remove the listener.
 */
export function addPushToStartTokenListener(listener) {
    return ExpoWidgetsModule.addListener('onExpoWidgetsPushToStartTokenReceived', listener);
}
//# sourceMappingURL=Widgets.js.map