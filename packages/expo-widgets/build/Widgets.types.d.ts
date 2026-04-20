import { SharedObject } from 'expo';
import { ReactNode } from 'react';
import { after } from './Widgets';
/**
 * The rendering mode of the widget as provided by WidgetKit.
 * - `fullColor` — Home screen widgets (default).
 * - `accented` — Tinted widgets (iOS 18+) and watchOS.
 * - `vibrant` — Lock screen widgets.
 */
export type WidgetRenderingMode = 'fullColor' | 'accented' | 'vibrant';
/**
 * The level of detail the view is recommended to have.
 * The system can update the levelOfDetail value based on user proximity or other system specific factors and allow content customization adapting to show different levels of details.
 * - `simplified` — The system recommends showing a simplified view with less details.
 * - `default` — The system has no specific recommendation for the level of detail.
 * @platform iOS 26+
 */
export type LevelOfDetail = 'simplified' | 'default';
/**
 * The size family of the current Live Activity.
 * A Live Activity you initiate on one device can also appear on a remote device that renders the Live Activity in a different family size. As a result, it renders for a specific family, depending on both the device and the location in which it appears.
 * @platform iOS 18+
 */
export type ActivityFamily = 'small' | 'medium';
/**
 * The widget family (size).
 * - `systemSmall` - Small square widget (2x2 grid).
 * - `systemMedium` - Medium widget (4x2 grid).
 * - `systemLarge` - Large widget (4x4 grid).
 * - `systemExtraLarge` - Extra large widget (iPad only, 6x4 grid).
 * - `accessoryCircular` - Circular accessory widget for the Lock Screen.
 * - `accessoryRectangular` - Rectangular accessory widget for the Lock Screen.
 * - `accessoryInline` - Inline accessory widget for the Lock Screen.
 */
export type WidgetFamily = 'systemSmall' | 'systemMedium' | 'systemLarge' | 'systemExtraLarge' | 'accessoryCircular' | 'accessoryRectangular' | 'accessoryInline';
export type WidgetEnvironment = {
    /**
     * The date of this timeline entry.
     */
    date: Date;
    /**
     * The widget family.
     */
    widgetFamily: WidgetFamily;
    /**
     * The color scheme of the widget's environment.
     */
    colorScheme?: 'light' | 'dark';
    /**
     * A Boolean value that indicates whether the display or environment currently requires reduced luminance.
     *
     * When you detect this condition, lower the overall brightness of your view.
     * For example, you can change large, filled shapes to be stroked, and choose less bright colors.
     * @platform iOS 16+
     */
    isLuminanceReduced?: boolean;
    /**
     * The widget's rendering mode, based on where the system is displaying it.
     * @platform iOS 16+
     */
    widgetRenderingMode?: WidgetRenderingMode;
    /**
     * A Boolean value that indicates whether an accessory family widget can display an accessory label.
     * @platform iOS 16+
     */
    showsWidgetLabel?: boolean;
    /**
     * The content margins for the widget.
     * @platform iOS 17+
     */
    widgetContentMargins?: {
        top: number;
        bottom: number;
        leading: number;
        trailing: number;
    };
    /**
     * The level of detail the view is recommended to have.
     * @platform iOS 26+
     */
    levelOfDetail?: LevelOfDetail;
};
export type LiveActivityEnvironment = {
    /**
     * The color scheme of the activity's environment.
     */
    colorScheme: 'light' | 'dark';
    /**
     * Whether the activity is displayed in a context with reduced luminance.
     * @platform iOS 16+
     */
    isLuminanceReduced?: boolean;
    /**
     * Whether the activity is currently displayed in fullscreen.
     * @platform iOS 16.1+
     */
    isActivityFullscreen?: boolean;
    /**
     * A Boolean value that indicates whether the Live Activity update synchronization rate is reduced.
     * @platform iOS 18+
     */
    isActivityUpdateReduced?: boolean;
    /**
     * The size family of the current Live Activity.
     * @platform iOS 18+
     */
    activityFamily?: ActivityFamily;
    /**
     * The level of detail the view is recommended to have.
     * @platform iOS 26+
     */
    levelOfDetail?: LevelOfDetail;
};
export type WidgetTimelineEntry<T extends object = object> = {
    /**
     * Date when widget should update.
     */
    date: Date;
    /**
     * Props to be passed to the widget.
     */
    props: T;
};
export type ExpoTimelineEntry = {
    timestamp: number;
    props: Record<string, any>;
};
/**
 * Defines the layout sections for an iOS Live Activity.
 */
export type LiveActivityLayout = {
    /**
     * The main banner content displayed in Notifications Center.
     */
    banner: ReactNode;
    /**
     * The small banner content displayed in CarPlay and WatchOS. Falls back to `banner` if not provided.
     */
    bannerSmall?: ReactNode;
    /**
     * The leading content in the compact Dynamic Island presentation.
     */
    compactLeading?: ReactNode;
    /**
     * The trailing content in the compact Dynamic Island presentation.
     */
    compactTrailing?: ReactNode;
    /**
     * The minimal content shown when the Dynamic Island is in its smallest form.
     */
    minimal?: ReactNode;
    /**
     * The center content in the expanded Dynamic Island presentation.
     */
    expandedCenter?: ReactNode;
    /**
     * The leading content in the expanded Dynamic Island presentation.
     */
    expandedLeading?: ReactNode;
    /**
     * The trailing content in the expanded Dynamic Island presentation.
     */
    expandedTrailing?: ReactNode;
    /**
     * The bottom content in the expanded Dynamic Island presentation.
     */
    expandedBottom?: ReactNode;
};
/**
 * A function that returns the layout for a Live Activity.
 */
export type LiveActivityComponent<T extends object = object> = (props: T, environment: LiveActivityEnvironment) => LiveActivityLayout;
/**
 * Event emitted when a user interacts with a widget.
 */
export type UserInteractionEvent = {
    /**
     * Widget that triggered the interaction.
     */
    source: string;
    /**
     * Button/toggle that was pressed.
     */
    target: string;
    /**
     * Timestamp of the event.
     */
    timestamp: number;
    /**
     * The event type identifier.
     */
    type: 'ExpoWidgetsUserInteraction';
};
/**
 * Event emitted when a push token is received for a live activity.
 */
export type PushTokenEvent = {
    /**
     * The ID of the live activity.
     */
    activityId: string;
    /**
     * The push token for the live activity.
     */
    pushToken: string;
};
/**
 * Event emitted when a push-to-start token is received.
 */
export type PushToStartTokenEvent = {
    /**
     * The push-to-start token for starting live activities remotely.
     */
    activityPushToStartToken: string;
};
/**
 * Dismissal policy for ending a live activity.
 * - `'default'` - The system’s default dismissal policy for the Live Activity.
 * - `'immediate'` - The system immediately removes the Live Activity that ended.
 * - `after(date)` - The system removes the Live Activity that ended at the specified time within a four-hour window.
 */
export type LiveActivityDismissalPolicy = 'default' | 'immediate' | ReturnType<typeof after>;
export type ExpoWidgetsEvents = {
    /**
     * Function that is invoked when user interacts with a widget.
     * @param event Interaction event details.
     */
    onExpoWidgetsUserInteraction: (event: UserInteractionEvent) => void;
    /**
     * Function that is invoked when a push-to-start token is received.
     * @param event Token event details.
     */
    onExpoWidgetsPushToStartTokenReceived: (event: PushToStartTokenEvent) => void;
};
export type LiveActivityEvents = {
    /**
     * Function that is invoked when a push token is received for a live activity.
     * @param event Token event details.
     */
    onExpoWidgetsTokenReceived: (event: PushTokenEvent) => void;
};
export declare class NativeWidgetObject extends SharedObject {
    constructor(name: string, layout: string);
    reload(): void;
    updateTimeline(entries: ExpoTimelineEntry[]): void;
    getTimeline(): Promise<ExpoTimelineEntry[]>;
}
export declare class NativeLiveActivityFactory extends SharedObject {
    constructor(name: string, layout: string);
    start(props: string, url?: string): NativeLiveActivity;
    getInstances(): NativeLiveActivity[];
}
export declare class NativeLiveActivity extends SharedObject<LiveActivityEvents> {
    update(props: string): Promise<void>;
    end(dismissalPolicy?: string, afterDate?: number, state?: string, contentDate?: number): Promise<void>;
    getPushToken(): Promise<string | null>;
}
//# sourceMappingURL=Widgets.types.d.ts.map