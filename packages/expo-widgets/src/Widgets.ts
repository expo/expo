import { type EventSubscription } from 'expo-modules-core';
import React from 'react';

import ExpoWidgetModule from './ExpoWidgets';
import {
  ExpoLiveActivityEntry,
  ExpoWidgetsEvents,
  LiveActivityDismissalPolicy,
  LiveActivityInfo,
  WidgetBase,
} from './Widgets.types';

/**
 * Starts a new Live Activity on iOS.
 * Live Activities display real-time information on the Lock Screen and in the Dynamic Island.
 * @param name The name/identifier of the Live Activity to start.
 * @param props Optional props to pass to the Live Activity layout.
 * @param url An optional deep link URL to open when the user taps the Live Activity.
 * @return The unique identifier of the started Live Activity.
 */
export const startLiveActivity = (name: string, props?: object, url?: string) => {
  const propsString = props ? JSON.stringify(props) : '{}';
  return ExpoWidgetModule.startLiveActivity(name, propsString, url);
};

/**
 * Updates an existing Live Activity with new content.
 * @param id The unique identifier of the Live Activity to update (returned from `startLiveActivity`).
 * @param name The name/identifier of the Live Activity.
 * @param props Optional props to pass to the Live Activity layout.
 */
export const updateLiveActivity = (id: string, name: string, props?: object) => {
  const propsString = props ? JSON.stringify(props) : '{}';
  ExpoWidgetModule.updateLiveActivity(id, name, propsString);
};

/**
 * Updates a widget's timeline with multiple entries that will be displayed at scheduled times.
 * The widget system will automatically switch between entries based on their timestamps.
 * @param name The name/identifier of the widget to update.
 * @param timeline Timeline entries with the dates and optional props for each entry.
 * @template T The type of custom props passed to the widget.
 */
export const updateWidgetTimeline = <T extends object>(
  name: string,
  timeline: { date: Date; props?: T }[]
) => {
  ExpoWidgetModule.updateWidgetTimeline(
    name,
    timeline.map((entry) => ({
      timestamp: entry.date.getTime(),
      props: entry.props || {},
    }))
  );

  ExpoWidgetModule.reloadWidget();
};

/**
 * Updates a widget with a single snapshot entry for the current time.
 * This is a convenience wrapper around `updateWidgetTimeline` for widgets that don't need multiple timeline entries.
 * @param name The name/identifier of the widget to update.
 * @param props Optional custom props to pass to the widget component.
 * @template T The type of custom props passed to the widget.
 */
export const updateWidgetSnapshot = <T extends object>(name: string, props?: T) => {
  updateWidgetTimeline(name, [{ date: new Date(), props }]);
};

/**
 * Adds a listener for widget interaction events (for example, button taps).
 * @param listener Callback function to handle user interaction events.
 * @return An event subscription that can be used to remove the listener.
 */
export function addUserInteractionListener(
  listener: ExpoWidgetsEvents['onExpoWidgetsUserInteraction']
): EventSubscription {
  return ExpoWidgetModule.addListener('onExpoWidgetsUserInteraction', listener);
}

/**
 * Adds a listener for push-to-start token events.
 * This token can be used to start live activities remotely via APNs.
 * @param listener Callback function to handle push-to-start token events.
 * @return An event subscription that can be used to remove the listener.
 */
export function addPushToStartTokenListener(
  listener: ExpoWidgetsEvents['onExpoWidgetsPushToStartTokenReceived']
): EventSubscription {
  return ExpoWidgetModule.addListener('onExpoWidgetsPushToStartTokenReceived', listener);
}

/**
 * Ends a live activity.
 * @param activityId The ID of the live activity to end.
 * @param dismissalPolicy How the live activity should be dismissed from the screen.
 */
export function endLiveActivity(
  activityId: string,
  dismissalPolicy: LiveActivityDismissalPolicy = 'default'
): void {
  return ExpoWidgetModule.endLiveActivity(activityId, dismissalPolicy);
}

/**
 * Adds a listener for push token updates.
 * @param listener Callback function to handle push token updates.
 * @return An event subscription that can be used to remove the listener.
 */
export function addPushTokenListener(
  listener: ExpoWidgetsEvents['onExpoWidgetsTokenReceived']
): EventSubscription {
  return ExpoWidgetModule.addListener('onExpoWidgetsTokenReceived', listener);
}

/**
 * Gets the push token for a specific live activity.
 * @param activityId The ID of the live activity.
 * @return A promise that resolves to the push token, or null if not available.
 */
export async function getLiveActivityPushToken(activityId: string): Promise<string | null> {
  return ExpoWidgetModule.getLiveActivityPushToken(activityId);
}

/**
 * Gets all currently running live activities.
 * @return An array of live activity information objects.
 */
export function getLiveActivities(): LiveActivityInfo[] {
  return ExpoWidgetModule.getLiveActivities();
}

/**
 * Registers a widget layout for a given widget name.
 * @param name The name/identifier of the widget.
 * @param widget A React component that renders the widget layout marked with `'widget'` directive.
 */
export function registerWidgetLayout<T extends object>(
  name: string,
  widget: (props: WidgetBase<T>) => React.JSX.Element
): void {
  ExpoWidgetModule.registerWidgetLayout(name, widget as unknown as string);
  ExpoWidgetModule.reloadWidget(name);
}

/**
 * Registers a Live Activity layout for a given activity name.
 * @param name The name/identifier of the Live Activity.
 * @param widget A function that returns the Live Activity layout marked with `'widget'` directive.
 */
export function registerLiveActivityLayout<T extends object>(
  name: string,
  widget: (props: T) => ExpoLiveActivityEntry
): void {
  ExpoWidgetModule.registerLiveActivityLayout(name, widget as unknown as string);
}
