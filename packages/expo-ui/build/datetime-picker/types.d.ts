import type { ViewProps } from 'react-native';
/**
 * @deprecated Used with the deprecated `onChange` prop.
 * */
export type DateTimePickerEvent = {
    /**
     * `'set'` when the user selects a date. `'dismissed'` when the user cancels
     * an Android dialog picker. iOS never fires `'dismissed'`.
     */
    type: 'set' | 'dismissed';
    nativeEvent: {
        timestamp: number;
        utcOffset: number;
    };
};
export type DateTimePickerChangeEvent = {
    nativeEvent: {
        timestamp: number;
        utcOffset: number;
    };
};
export type DateTimePickerProps = {
    /**
     * The current date value (controlled).
     */
    value: Date;
    /**
     * Called when the user changes the date/time or dismisses the picker.
     * The event type is encoded in `event.type`.
     * If the new specific listeners are provided, they take precedence.
     *
     * @deprecated Use `onValueChange` and `onDismiss` instead.
     */
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    /**
     * Called when the user selects a date or time.
     */
    onValueChange?: (event: DateTimePickerChangeEvent, date: Date) => void;
    /**
     * Called when the picker is dismissed without selecting a value.
     * @platform android
     */
    onDismiss?: () => void;
    /**
     * The picker mode.
     * @default 'date'
     */
    mode?: 'date' | 'time' | 'datetime';
    /**
     * The earliest selectable date.
     */
    minimumDate?: Date;
    /**
     * The latest selectable date.
     */
    maximumDate?: Date;
    /**
     * A test ID forwarded to the native view.
     * Note: on Android dialog presentation, the test ID is not forwarded.
     */
    testID?: string;
    /**
     * Display style. Android supports `'default' | 'spinner'` — `'spinner'` shows a text input
     * rather than a scroll wheel (Material 3 does not have a wheel-style picker).
     * iOS supports `'default' | 'spinner' | 'compact' | 'inline'`.
     * @default 'default'
     */
    display?: 'default' | 'spinner' | 'compact' | 'inline' | 'calendar' | 'clock';
    /**
     * Use 24-hour format.
     * @platform android
     */
    is24Hour?: boolean;
    /**
     * Accent/tint color applied to the picker.
     * Maps to `color` on Android and `tint` on iOS.
     */
    accentColor?: string;
    /**
     * Whether the picker is disabled.
     * @platform ios
     */
    disabled?: boolean;
    /**
     * Locale identifier (e.g. 'en_US', 'fr_FR') for the picker display.
     * @platform ios
     */
    locale?: string;
    /**
     * Force a specific color scheme on the picker.
     * @platform ios
     */
    themeVariant?: 'dark' | 'light';
    /**
     * IANA time zone name (e.g. 'America/New_York') for the picker display.
     * @platform ios
     */
    timeZoneName?: string;
    /**
     * How the picker is presented.
     * - `'inline'` renders the picker directly in the view hierarchy.
     * - `'dialog'` shows a modal dialog that opens on mount. Fires `onValueChange` on confirmation, `onDismiss` on cancel. The caller should
     *   unmount the component in response.
     *
     * On iOS this prop is accepted but ignored (always inline).
     * On Android the default is `'dialog'`.
     * @default 'dialog'
     * @platform android
     */
    presentation?: 'inline' | 'dialog';
    /**
     * Set the positive (confirm) button label.
     * @platform android
     */
    positiveButton?: {
        label?: string;
    };
    /**
     * Set the negative (cancel) button label.
     * @platform android
     */
    negativeButton?: {
        label?: string;
    };
} & Pick<ViewProps, 'style'>;
export declare function buildEvent(date: Date): DateTimePickerEvent;
export declare function buildChangeEvent(date: Date): DateTimePickerChangeEvent;
//# sourceMappingURL=types.d.ts.map