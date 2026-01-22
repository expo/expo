import { type EventSubscription } from 'expo-modules-core';
import React from 'react';
import { ExpoWidgetsEvents, LiveActivityComponent, WidgetBase } from './Widgets.types';
/**
 * Starts a new Live Activity on iOS.
 * Live Activities display real-time information on the Lock Screen and in the Dynamic Island.
 * @param name The name/identifier of the Live Activity to start.
 * @param liveActivity A function that returns the Live Activity layout configuration.
 * @param url An optional deep link URL to open when the user taps the Live Activity.
 * @return The unique identifier of the started Live Activity.
 * @platform ios
 */
export declare const startLiveActivity: (name: string, liveActivity: LiveActivityComponent, url?: string) => string;
/**
 * Updates an existing Live Activity with new content.
 * @param id The unique identifier of the Live Activity to update (returned from `startLiveActivity`).
 * @param name The name/identifier of the Live Activity.
 * @param liveActivity A function that returns the updated Live Activity layout configuration.
 * @platform ios
 */
export declare const updateLiveActivity: (id: string, name: string, liveActivity: LiveActivityComponent) => void;
/**
 * Updates a widget's timeline with multiple entries that will be displayed at scheduled times.
 * The widget system will automatically switch between entries based on their timestamps.
 * @param name The name/identifier of the widget to update.
 * @param dates An array of dates representing when each timeline entry should be displayed.
 * @param widget A function component that renders the widget content for a given set of props.
 * @param props Optional custom props to pass to the widget component.
 * @param updateFunction Optional name of a function to call for dynamic updates.
 * @template T The type of custom props passed to the widget.
 * @platform ios
 */
export declare const updateWidgetTimeline: <T extends object>(name: string, dates: Date[], widget: (p: WidgetBase<T>) => React.JSX.Element, props?: T, updateFunction?: string) => void;
/**
 * Updates a widget with a single snapshot entry for the current time.
 * This is a convenience wrapper around `updateWidgetTimeline` for widgets that don't need multiple timeline entries.
 * @param name The name/identifier of the widget to update.
 * @param widget A function component that renders the widget content for a given set of props.
 * @param props Optional custom props to pass to the widget component.
 * @param updateFunction Optional name of a function to call for dynamic updates.
 * @template T The type of custom props passed to the widget.
 * @platform ios
 */
export declare const updateWidgetSnapshot: <T extends object>(name: string, widget: (p: WidgetBase<T>) => React.JSX.Element, props?: T, updateFunction?: string) => void;
/**
 * Adds a listener for widget interaction events (e.g., button taps).
 * @param listener Callback function to handle user interaction events.
 * @return An event subscription that can be used to remove the listener.
 * @platform ios
 */
export declare function addUserInteractionListener(listener: ExpoWidgetsEvents['onUserInteraction']): EventSubscription;
//# sourceMappingURL=Widgets.d.ts.map