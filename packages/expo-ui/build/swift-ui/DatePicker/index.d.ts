import { StyleProp, ViewStyle } from 'react-native';
import { ViewEvent } from '../../types';
export type IOSVariant = 'wheel' | 'automatic' | 'graphical' | 'compact';
export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';
export type DateTimePickerProps = {
    /**
     * The initial date to display on the picker.
     */
    initialDate?: string | null;
    /**
     * A title displayed on the picker on iOS.
     * @platform ios
     */
    title?: string;
    /**
     * Callback function that is called when a date is selected.
     */
    onDateSelected?: (date: Date) => void;
    /**
     * The variant of the picker, which determines its appearance and behavior.
     * @default 'automatic'
     */
    variant?: IOSVariant;
    /**
     * The components that the picker should display.
     * On iOS, you can have a picker that selects both date and time.
     * @default 'date'
     */
    displayedComponents?: DisplayedComponents;
    /**
     * The tint color to use on the picker elements.
     */
    color?: string;
};
type NativeDatePickerProps = Omit<DateTimePickerProps, 'variant' | 'onDateSelected'> & {
    variant?: IOSVariant;
} & ViewEvent<'onDateSelected', {
    date: Date;
}>;
/**
 * @hidden
 */
export declare function transformDateTimePickerProps(props: DateTimePickerProps): NativeDatePickerProps;
/**
 * `<DateTimePicker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function DateTimePickerPrimitive(props: DateTimePickerProps): import("react").JSX.Element;
/**
 * Renders a `DateTimePicker` component.
 */
export declare function DateTimePicker(props: DateTimePickerProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map