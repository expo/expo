import { type EventSubscription } from 'expo-modules-core';

import ExpoWidgetsModule from './ExpoWidgets';
import type {
  ExpoWidgetsEvents,
  LiveActivityComponent,
  LiveActivityDismissalPolicy,
  NativeLiveActivity,
  NativeLiveActivityFactory,
  NativeWidgetObject,
  WidgetBase,
  WidgetTimelineEntry,
} from './Widgets.types';

/**
 * Represents a widget instance. Provides methods to manage the widget's timeline.
 */
export class Widget<T extends object = object> {
  /** @hidden */
  private nativeWidgetObject: NativeWidgetObject;
  constructor(name: string, layout: (p: WidgetBase<T>) => React.JSX.Element) {
    this.nativeWidgetObject = new ExpoWidgetsModule.Widget(name, layout as unknown as string);
  }

  /**
   * Force reloads the widget, causing it to refresh its content and timeline.
   */
  reload() {
    this.nativeWidgetObject.reload();
  }

  /**
   * Schedules a series of updates for the widget's content.
   * @param entries Timeline entries, each specifying a date and the props to display at that time.
   */
  updateTimeline(entries: WidgetTimelineEntry<T>[]) {
    this.nativeWidgetObject.updateTimeline(
      entries.map((entry) => ({ timestamp: entry.date.getTime(), props: entry.props }))
    );
  }

  /**
   * Sets the widget's content to the given props immediately, without scheduling a timeline.
   * @param props The properties to display in the widget.
   */
  updateSnapshot(props: T) {
    this.nativeWidgetObject.updateTimeline([{ timestamp: Date.now(), props }]);
  }

  /**
   * Returns the current timeline entries for the widget, including past and future entries.
   */
  async getTimeline(): Promise<WidgetTimelineEntry<T>[]> {
    return (await this.nativeWidgetObject.getTimeline()).map((entry) => ({
      date: new Date(entry.timestamp),
      props: entry.props as T,
    }));
  }
}

/**
 * Represents a Live Activity instance. Provides methods to update its content and end it.
 */
export class LiveActivity<T extends object = object> {
  /** @hidden */
  private nativeLiveActivity: NativeLiveActivity;
  constructor(nativeLiveActivity: NativeLiveActivity) {
    this.nativeLiveActivity = nativeLiveActivity;
  }

  /**
   * Updates the Live Activity's content. The UI reflects the new properties immediately.
   * @param props The updated content properties.
   */
  update(props: T) {
    this.nativeLiveActivity.update(JSON.stringify(props));
  }

  /**
   * Ends the Live Activity.
   * @param dismissalPolicy Controls when the Live Activity is removed from the Lock Screen after ending.
   */
  end(dismissalPolicy?: LiveActivityDismissalPolicy) {
    this.nativeLiveActivity.end(dismissalPolicy);
  }
}

/**
 * Manages Live Activity instances of a specific type. Use it to start new activities and retrieve currently active ones.
 */
export class LiveActivityFactory<T extends object = object> {
  /** @hidden */
  private nativeLiveActivityFactory: NativeLiveActivityFactory;
  constructor(name: string, layout: LiveActivityComponent<T>) {
    this.nativeLiveActivityFactory = new ExpoWidgetsModule.LiveActivityFactory(
      name,
      layout as unknown as string
    );
  }

  /**
   * Starts a new Live Activity with the given properties.
   * @param props The initial content properties for the Live Activity.
   * @param url An optional URL to associate with the Live Activity, used for deep linking.
   * @returns The new Live Activity instance.
   */
  start(props: T, url?: string) {
    return new LiveActivity<T>(this.nativeLiveActivityFactory.start(JSON.stringify(props), url));
  }

  /**
   * Returns all currently active instances of this Live Activity type.
   */
  getInstances() {
    return this.nativeLiveActivityFactory
      .getInstances()
      .map((instance) => new LiveActivity<T>(instance));
  }
}

/**
 * Creates a Widget instance.
 * @param name The widget name. Must match the `'name'` field in your widget configuration in the app config.
 * @param widget The widget component, marked with the `'widget'` directive.
 */
export function createWidget<T extends object = object>(
  name: string,
  widget: (props: WidgetBase<T>) => React.JSX.Element
): Widget<T> {
  return new Widget<T>(name, widget);
}

/**
 * Creates a Live Activity Factory for managing Live Activities of a specific type.
 * @param name The Live Activity name. Must match the `'name'` field in your widget configuration in the app config.
 * @param liveActivity The Live Activity component, marked with the `'widget'` directive.
 */
export function createLiveActivity<T extends object = object>(
  name: string,
  liveActivity: LiveActivityComponent<T>
): LiveActivityFactory<T> {
  return new LiveActivityFactory<T>(name, liveActivity);
}

/**
 * Adds a listener for widget interaction events (for example, button taps).
 * @param listener Callback function to handle user interaction events.
 * @return An event subscription that can be used to remove the listener.
 */
export function addUserInteractionListener(
  listener: ExpoWidgetsEvents['onExpoWidgetsUserInteraction']
): EventSubscription {
  return ExpoWidgetsModule.addListener('onExpoWidgetsUserInteraction', listener);
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
  return ExpoWidgetsModule.addListener('onExpoWidgetsPushToStartTokenReceived', listener);
}
