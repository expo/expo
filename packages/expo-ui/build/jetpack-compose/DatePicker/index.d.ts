import { StyleProp, ViewStyle } from 'react-native';
import { ExpoModifier, ViewEvent } from '../../types';
export type AndroidVariant = 'picker' | 'input';
export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';
export type DateTimePickerProps = {
    /**
     * The initial date to display on the picker.
     */
    initialDate?: string | null;
    /**
     * Callback function that is called when a date is selected.
     */
    onDateSelected?: (date: Date) => void;
    /**
     * The variant of the picker, which determines its appearance and behavior.
     * @default 'picker'
     */
    variant?: AndroidVariant;
    /**
     * Show to button to toggle between variants on Android.
     * @default true
     */
    showVariantToggle?: boolean;
    /**
     * The components that the picker should display.
     * On Android, you can have a picker that selects just the date or just the time.
     * `dateAndTime` is only available on iOS and will result in a date picker on Android.
     * On iOS, you can have a picker that selects both date and time.
     * @default 'date'
     */
    displayedComponents?: DisplayedComponents;
    /**
     * Optional style to apply to the component.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * The tint color to use on the picker elements.
     */
    color?: string;
    /**
     * Determines what format the clock should be displayed in on Android.
     * @default true
     */
    is24Hour?: boolean;
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
};
type NativeDatePickerProps = Omit<DateTimePickerProps, 'variant' | 'onDateSelected' | 'initialDate'> & {
    variant?: AndroidVariant;
    initialDate?: number | null;
} & ViewEvent<'onDateSelected', {
    date: Date;
}>;
/**
 * @hidden
 */
export declare function transformDateTimePickerProps(props: DateTimePickerProps): NativeDatePickerProps;
/**
 * Renders a `DateTimePicker` component.
 */
export declare function DateTimePicker(props: DateTimePickerProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map