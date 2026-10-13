import { SharedObject } from 'expo';
import type { ReactNode } from 'react';

/**
 * The views of a custom notification. Each section is rendered into its own `RemoteViews` at a
 * fixed size, so a section cannot depend on the size of another section.
 * @platform android
 */
export type CustomNotificationLayout = {
  /**
   * The collapsed row shown in the notification shade. The system gives it about 64 dp of height.
   */
  collapsed: ReactNode;
  /**
   * The expanded view shown when the user expands the notification. The system gives it up to
   * 256 dp of height. When omitted, the system derives the expanded view from `collapsed`.
   */
  expanded?: ReactNode;
  /**
   * The heads-up view shown when the notification peeks over the current screen. The system gives
   * it about 88 dp of height. When omitted, the system reuses `collapsed`. The channel importance
   * decides whether a heads-up view is shown at all.
   */
  headsUp?: ReactNode;
};

/**
 * Values the system provides to a custom notification layout.
 * @platform android
 */
export type CustomNotificationEnvironment = {
  /**
   * The color scheme of the device at render time.
   */
  colorScheme: 'light' | 'dark';
};

/**
 * A function that returns the views of a custom notification. It must start with the `'widget'`
 * directive and use `@expo/ui/jetpack-compose` components.
 * @platform android
 */
export type CustomNotificationComponent<T extends object = object> = (
  props: T,
  environment: CustomNotificationEnvironment
) => CustomNotificationLayout;

/**
 * Presentation options of a custom notification.
 * @platform android
 */
export type CustomNotificationOptions = {
  /**
   * The key of the notification. Posting with the key of an active notification replaces that
   * notification in place. Defaults to a random UUID.
   */
  id?: string;
  /**
   * The notification channel the notification is posted to. The channel must exist, for example
   * created with `expo-notifications`. Defaults to a low-importance channel named
   * `expo_widgets_notifications` that `expo-widgets` creates on first use.
   */
  channelId?: string;
  /**
   * The content title. Screen readers announce it, and the system uses it when it cannot show the
   * custom views.
   */
  title?: string;
  /**
   * The content text. The system uses it when it cannot show the custom views.
   */
  text?: string;
  /**
   * Whether the user cannot dismiss the notification with a swipe.
   * @default false
   */
  ongoing?: boolean;
  /**
   * Whether a tap removes the notification.
   * @default The opposite of `ongoing`.
   */
  autoCancel?: boolean;
  /**
   * Whether sound, vibration, and the heads-up view are used only for the first post and not for
   * updates.
   * @default true
   */
  alertOnlyOnce?: boolean;
  /**
   * Time in milliseconds after which the system removes the notification. Useful after a final
   * update that sets `ongoing` to `false`.
   */
  timeoutAfter?: number;
  /**
   * A deep link opened in this app when the user taps the notification. Defaults to the launch
   * intent of the app.
   */
  url?: string;
  /**
   * The name of a drawable resource used as the small icon. Defaults to the icon configured by
   * the `expo-notifications` config plugin, and then to the app icon.
   */
  smallIcon?: string;
  /**
   * The accent color in `#RRGGBB` or `#AARRGGBB` format. Defaults to the color configured by the
   * `expo-notifications` config plugin.
   */
  color?: string;
};

/**
 * Presentation options that an update can override. Options that an update omits keep the value
 * from the previous post or update.
 * @platform android
 */
export type CustomNotificationUpdateOptions = Omit<CustomNotificationOptions, 'id'>;

/** @hidden */
export declare class NativeCustomNotification extends SharedObject {
  getId(): string;
  getProps(): Promise<Record<string, any>>;
  update(props: Record<string, any>, options: CustomNotificationUpdateOptions): Promise<void>;
  cancel(): Promise<void>;
}

/** @hidden */
export declare class NativeCustomNotificationFactory extends SharedObject {
  constructor(name: string, layout: string);
  post(
    id: string,
    props: Record<string, any>,
    options: CustomNotificationUpdateOptions
  ): Promise<NativeCustomNotification>;
  get(id: string): Promise<NativeCustomNotification | null>;
  getActive(): Promise<NativeCustomNotification[]>;
  cancelAll(): Promise<void>;
}
