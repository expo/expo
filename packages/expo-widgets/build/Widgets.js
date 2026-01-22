import ExpoWidgetModule from './ExpoWidgets';
import { supportedFamilies } from './constants';
import { serialize } from './serializer';
/**
 * Starts a new Live Activity on iOS.
 * Live Activities display real-time information on the Lock Screen and in the Dynamic Island.
 * @param name The name/identifier of the Live Activity to start.
 * @param liveActivity A function that returns the Live Activity layout configuration.
 * @param url An optional deep link URL to open when the user taps the Live Activity.
 * @return The unique identifier of the started Live Activity.
 */
export const startLiveActivity = (name, liveActivity, url) => {
    const text = serialize(liveActivity());
    return ExpoWidgetModule.startLiveActivity(name, text, url);
};
/**
 * Updates an existing Live Activity with new content.
 * @param id The unique identifier of the Live Activity to update (returned from `startLiveActivity`).
 * @param name The name/identifier of the Live Activity.
 * @param liveActivity A function that returns the updated Live Activity layout configuration.
 */
export const updateLiveActivity = (id, name, liveActivity) => {
    const text = serialize(liveActivity());
    ExpoWidgetModule.updateLiveActivity(id, name, text);
};
/**
 * Updates a widget's timeline with multiple entries that will be displayed at scheduled times.
 * The widget system will automatically switch between entries based on their timestamps.
 * @param name The name/identifier of the widget to update.
 * @param dates An array of dates representing when each timeline entry should be displayed.
 * @param widget A function component that renders the widget content for a given set of props.
 * @param props Optional custom props to pass to the widget component.
 * @param updateFunction Optional name of a function to call for dynamic updates.
 * @template T The type of custom props passed to the widget.
 */
export const updateWidgetTimeline = (name, dates, widget, props, updateFunction) => {
    const fakeProps = Object.keys(props || {}).reduce((acc, key) => {
        acc[key] = `{{${key}}}`;
        return acc;
    }, {});
    const data = supportedFamilies
        .map((family) => ({
        family,
        entries: dates.map((date) => ({
            timestamp: date.getTime(),
            content: widget({ date, family, ...fakeProps }),
        })),
    }))
        .reduce((acc, { family, entries }) => {
        acc[family] = entries;
        return acc;
    }, {});
    ExpoWidgetModule.updateWidget(name, serialize(data), props, updateFunction);
    ExpoWidgetModule.reloadWidget();
};
/**
 * Updates a widget with a single snapshot entry for the current time.
 * This is a convenience wrapper around `updateWidgetTimeline` for widgets that don't need multiple timeline entries.
 * @param name The name/identifier of the widget to update.
 * @param widget A function component that renders the widget content for a given set of props.
 * @param props Optional custom props to pass to the widget component.
 * @param updateFunction Optional name of a function to call for dynamic updates.
 * @template T The type of custom props passed to the widget.
 */
export const updateWidgetSnapshot = (name, widget, props, updateFunction // (target: string, props: T) => T
) => {
    updateWidgetTimeline(name, [new Date()], widget, props || {}, updateFunction);
};
/**
 * Adds a listener for widget interaction events (for example, button taps).
 * @param listener Callback function to handle user interaction events.
 * @return An event subscription that can be used to remove the listener.
 */
export function addUserInteractionListener(listener) {
    return ExpoWidgetModule.addListener('onUserInteraction', listener);
}
//# sourceMappingURL=Widgets.js.map