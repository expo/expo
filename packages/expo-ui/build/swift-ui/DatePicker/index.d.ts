import { type CommonViewModifierProps } from '../types';
export type IOSVariant = 'wheel' | 'automatic' | 'graphical' | 'compact';
export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';
export type DateRange = {
    lowerBound: string | null;
    upperBound: string | null;
};
export type DateTimePickerProps = {
    /**
     * The date to display on the picker.
     */
    date?: string | null;
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
    /**
     * The date range that the user can select from.
     * If not provided, the user can select any date.
     */
    range?: DateRange;
} & CommonViewModifierProps;
/**
 * Renders a `DateTimePicker` component.
 */
export declare function DateTimePicker(props: DateTimePickerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map