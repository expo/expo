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
    onDateChange?: (date: Date) => void;
    /**
     * Children to use as a custom label.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Renders a SwiftUI `DatePicker` component.
 */
export declare function DatePicker(props: DatePickerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map