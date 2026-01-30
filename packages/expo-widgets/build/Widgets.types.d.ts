import { ReactNode } from 'react';
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
/**
 * Props passed to a widget component.
 */
export type WidgetBase<T extends object = object> = {
    /**
     * The date of this timeline entry.
     */
    date: Date;
    /**
     * The widget family.
     */
    family: WidgetFamily;
} & T;
export type ExpoTimelineEntry = {
    timestamp: number;
    content: ReactNode;
};
/**
 * Defines the layout sections for an iOS Live Activity.
 */
export type ExpoLiveActivityEntry = {
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
export type LiveActivityComponent = () => ExpoLiveActivityEntry;
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
 * Event emitted when a push-to-start token is received.
 */
export type PushToStartTokenEvent = {
    /**
     * The push-to-start token for starting live activities remotely.
     */
    activityPushToStartToken: string;
};
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
//# sourceMappingURL=Widgets.types.d.ts.map