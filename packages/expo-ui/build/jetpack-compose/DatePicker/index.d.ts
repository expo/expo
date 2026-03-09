import { type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
export type AndroidVariant = 'picker' | 'input';
export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';
/**
 * Color overrides for the Material 3 DatePicker component.
 * All properties are optional — unset values use Material 3 theme defaults.
 */
export type DatePickerElementColors = {
    containerColor?: ColorValue;
    titleContentColor?: ColorValue;
    headlineContentColor?: ColorValue;
    weekdayContentColor?: ColorValue;
    subheadContentColor?: ColorValue;
    navigationContentColor?: ColorValue;
    yearContentColor?: ColorValue;
    disabledYearContentColor?: ColorValue;
    currentYearContentColor?: ColorValue;
    selectedYearContentColor?: ColorValue;
    disabledSelectedYearContentColor?: ColorValue;
    selectedYearContainerColor?: ColorValue;
    disabledSelectedYearContainerColor?: ColorValue;
    dayContentColor?: ColorValue;
    disabledDayContentColor?: ColorValue;
    selectedDayContentColor?: ColorValue;
    disabledSelectedDayContentColor?: ColorValue;
    selectedDayContainerColor?: ColorValue;
    disabledSelectedDayContainerColor?: ColorValue;
    todayContentColor?: ColorValue;
    todayDateBorderColor?: ColorValue;
    dayInSelectionRangeContentColor?: ColorValue;
    dayInSelectionRangeContainerColor?: ColorValue;
    dividerColor?: ColorValue;
};
/**
 * Color overrides for the Material 3 TimePicker component.
 * All properties are optional — unset values use Material 3 theme defaults.
 */
export type TimePickerElementColors = {
    containerColor?: ColorValue;
    clockDialColor?: ColorValue;
    clockDialSelectedContentColor?: ColorValue;
    clockDialUnselectedContentColor?: ColorValue;
    selectorColor?: ColorValue;
    periodSelectorBorderColor?: ColorValue;
    periodSelectorSelectedContainerColor?: ColorValue;
    periodSelectorUnselectedContainerColor?: ColorValue;
    periodSelectorSelectedContentColor?: ColorValue;
    periodSelectorUnselectedContentColor?: ColorValue;
    timeSelectorSelectedContainerColor?: ColorValue;
    timeSelectorUnselectedContainerColor?: ColorValue;
    timeSelectorSelectedContentColor?: ColorValue;
    timeSelectorUnselectedContentColor?: ColorValue;
};
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
     * The tint color to use on the picker elements.
     * When `elementColors` is not provided, this color is applied to a subset of
     * picker elements (selected day, title, headline, today border for date picker;
     * selector, selected time segment, clock dial for time picker).
     */
    color?: ColorValue;
    /**
     * Fine-grained color overrides for individual picker elements.
     * When provided, these take precedence over the `color` prop.
     * Date picker color keys are used when `displayedComponents` is 'date' or 'dateAndTime'.
     * Time picker color keys are used when `displayedComponents` is 'hourAndMinute'.
     * Unset values fall back to Material 3 theme defaults.
     */
    elementColors?: DatePickerElementColors & TimePickerElementColors;
    /**
     * Determines what format the clock should be displayed in on Android.
     * @default true
     */
    is24Hour?: boolean;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * Renders a `DateTimePicker` component.
 */
export declare function DateTimePicker(props: DateTimePickerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
