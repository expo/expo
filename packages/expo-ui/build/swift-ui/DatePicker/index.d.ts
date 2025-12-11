import * as React from 'react';
import type { ColorValue } from 'react-native';
import { type CommonViewModifierProps } from '../types';
export type DatePickerComponent = 'date' | 'hourAndMinute';
export type DateRange = {
    start?: Date;
    end?: Date;
};
export type DatePickerProps = {
    /**
     * A title/label displayed on the picker.
     */
    title?: string;
    /**
     * The currently selected date.
     */
    selection?: Date;
    /**
     * The selectable date range.
     */
    range?: DateRange;
    /**
     * The components to display: 'date' and/or 'hourAndMinute'.
     * @default ['date']
     */
    displayedComponents?: DatePickerComponent[];
    /**
     * Callback when the date selection changes.
     */
    onDateChange?: (event: {
        nativeEvent: {
            date: Date;
        };
    }) => void;
    /**
     * Children to use as a custom label.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Renders a SwiftUI `DatePicker` component.
 */
export declare function DatePicker(props: DatePickerProps): React.JSX.Element;
export type IOSVariant = 'wheel' | 'automatic' | 'graphical' | 'compact';
export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';
export type DateTimePickerProps = {
    /**
     * The initial date to display on the picker.
     */
    initialDate?: string | null;
    /**
     * A title displayed on the picker on iOS.
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
    color?: ColorValue;
} & CommonViewModifierProps;
/**
 * Renders a `DateTimePicker` component.
 */
export declare function DateTimePicker(props: DateTimePickerProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map