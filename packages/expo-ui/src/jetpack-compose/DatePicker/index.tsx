import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type AndroidVariant = 'picker' | 'input';

export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';

/**
 * Color overrides for the Material 3 DatePicker component.
 * All properties are optional — unset values use Material 3 theme defaults.
 */
export type DatePickerElementColors = {
  /** The background color of the date picker. */
  containerColor?: ColorValue;
  /** The color used for the date picker's title. */
  titleContentColor?: ColorValue;
  /** The color used for the date picker's headline. */
  headlineContentColor?: ColorValue;
  /** The color used for the weekday letters (Mon, Tue, etc.). */
  weekdayContentColor?: ColorValue;
  /** The color used for the month and year subhead labels. */
  subheadContentColor?: ColorValue;
  /** The color used for navigation arrows and year selection menu button. */
  navigationContentColor?: ColorValue;
  /** The color used for year item content. */
  yearContentColor?: ColorValue;
  /** The color used for disabled year item content. */
  disabledYearContentColor?: ColorValue;
  /** The color used for the current year content. */
  currentYearContentColor?: ColorValue;
  /** The color used for the selected year content. */
  selectedYearContentColor?: ColorValue;
  /** The color used for a disabled selected year content. */
  disabledSelectedYearContentColor?: ColorValue;
  /** The color used for the selected year container/background. */
  selectedYearContainerColor?: ColorValue;
  /** The color used for a disabled selected year container. */
  disabledSelectedYearContainerColor?: ColorValue;
  /** The color used for day content (number text). */
  dayContentColor?: ColorValue;
  /** The color used for disabled day content. */
  disabledDayContentColor?: ColorValue;
  /** The color used for selected day content. */
  selectedDayContentColor?: ColorValue;
  /** The color used for a disabled selected day content. */
  disabledSelectedDayContentColor?: ColorValue;
  /** The color used for the selected day container/background circle. */
  selectedDayContainerColor?: ColorValue;
  /** The color used for a disabled selected day container. */
  disabledSelectedDayContainerColor?: ColorValue;
  /** The color used for today's date text. */
  todayContentColor?: ColorValue;
  /** The color used for today's date border. */
  todayDateBorderColor?: ColorValue;
  /** The content color for days within a date range selection. */
  dayInSelectionRangeContentColor?: ColorValue;
  /** The container color for days within a date range selection. */
  dayInSelectionRangeContainerColor?: ColorValue;
  /** The color used for divider lines. */
  dividerColor?: ColorValue;
};

/**
 * Color overrides for the Material 3 TimePicker component.
 * All properties are optional — unset values use Material 3 theme defaults.
 */
export type TimePickerElementColors = {
  /** The container/background color of the time picker. */
  containerColor?: ColorValue;
  /** The background color of the clock dial. */
  clockDialColor?: ColorValue;
  /** The color of clock dial numbers when selected or overlapping the selector. */
  clockDialSelectedContentColor?: ColorValue;
  /** The color of clock dial numbers when unselected. */
  clockDialUnselectedContentColor?: ColorValue;
  /** The color of the clock dial selector (hand). */
  selectorColor?: ColorValue;
  /** The border color of the AM/PM period selector. */
  periodSelectorBorderColor?: ColorValue;
  /** The background color of the selected AM/PM period. */
  periodSelectorSelectedContainerColor?: ColorValue;
  /** The background color of the unselected AM/PM period. */
  periodSelectorUnselectedContainerColor?: ColorValue;
  /** The text color of the selected AM/PM period. */
  periodSelectorSelectedContentColor?: ColorValue;
  /** The text color of the unselected AM/PM period. */
  periodSelectorUnselectedContentColor?: ColorValue;
  /** The background color of the selected hour/minute segment. */
  timeSelectorSelectedContainerColor?: ColorValue;
  /** The background color of the unselected hour/minute segment. */
  timeSelectorUnselectedContainerColor?: ColorValue;
  /** The text color of the selected hour/minute segment. */
  timeSelectorSelectedContentColor?: ColorValue;
  /** The text color of the unselected hour/minute segment. */
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
   * Constrains which dates can be selected. Mirrors the native Compose `selectableDates` parameter.
   * `start` is the earliest selectable date, `end` is the latest.
   */
  selectableDates?: { start?: Date; end?: Date };
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeDatePickerProps = Omit<
  DateTimePickerProps,
  'variant' | 'onDateSelected' | 'initialDate' | 'elementColors' | 'selectableDates'
> & {
  variant?: AndroidVariant;
  initialDate?: number | null;
  selectableDates?: { start?: number | null; end?: number | null } | null;
  elementColors?: DatePickerElementColors & TimePickerElementColors;
} & ViewEvent<'onDateSelected', { date: Date }>;

function convertSelectableDates(selectableDates?: {
  start?: Date;
  end?: Date;
}): { start?: number | null; end?: number | null } | null {
  if (!selectableDates) return null;
  return {
    start: selectableDates.start ? selectableDates.start.getTime() : null,
    end: selectableDates.end ? selectableDates.end.getTime() : null,
  };
}

function transformDateTimePickerProps(props: DateTimePickerProps): NativeDatePickerProps {
  const { modifiers, variant, initialDate, selectableDates, elementColors, color, ...rest } = props;

  // Convert ISO string to timestamp for Android
  const initialDateTimestamp = initialDate ? new Date(initialDate).getTime() : null;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...rest,
    color,
    initialDate: initialDateTimestamp,
    selectableDates: convertSelectableDates(selectableDates),
    onDateSelected: ({ nativeEvent: { date } }) => {
      props.onDateSelected?.(new Date(date));
    },
    variant,
    ...(elementColors != null ? { elementColors } : undefined),
  };
}

const DatePickerNativeView: React.ComponentType<NativeDatePickerProps> = requireNativeView(
  'ExpoUI',
  'DateTimePickerView'
);

/**
 * Renders an inline `DateTimePicker` component.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  return <DatePickerNativeView {...transformDateTimePickerProps(props)} />;
}

// -- Dialog views (used internally by the compat layer) ---------------------

export type DatePickerDialogProps = {
  initialDate?: string | null;
  variant?: AndroidVariant;
  showVariantToggle?: boolean;
  confirmButtonLabel?: string;
  dismissButtonLabel?: string;
  color?: ColorValue;
  elementColors?: DatePickerElementColors & TimePickerElementColors;
  selectableDates?: { start?: Date; end?: Date };
  onDateSelected?: (date: Date) => void;
  onDismissRequest: () => void;
};

type NativeDatePickerDialogProps = Omit<
  DatePickerDialogProps,
  | 'variant'
  | 'onDateSelected'
  | 'onDismissRequest'
  | 'initialDate'
  | 'elementColors'
  | 'selectableDates'
> & {
  variant?: AndroidVariant;
  initialDate?: number | null;
  selectableDates?: { start?: number | null; end?: number | null } | null;
  elementColors?: DatePickerElementColors & TimePickerElementColors;
} & ViewEvent<'onDateSelected', { date: Date }> &
  ViewEvent<'onDismissRequest', void>;

const DatePickerDialogNativeView: React.ComponentType<NativeDatePickerDialogProps> =
  requireNativeView('ExpoUI', 'DatePickerDialogView');

export function DatePickerDialog(props: DatePickerDialogProps) {
  const { variant, initialDate, selectableDates, elementColors, onDismissRequest, ...rest } = props;
  const nativeProps: NativeDatePickerDialogProps = {
    ...rest,
    variant,
    initialDate: initialDate ? new Date(initialDate).getTime() : null,
    selectableDates: convertSelectableDates(selectableDates),
    onDateSelected: ({ nativeEvent: { date } }) => {
      props.onDateSelected?.(new Date(date));
    },
    onDismissRequest,
    ...(elementColors != null ? { elementColors } : undefined),
  };
  return <DatePickerDialogNativeView {...nativeProps} />;
}

export type TimePickerDialogProps = {
  initialDate?: string | null;
  is24Hour?: boolean;
  confirmButtonLabel?: string;
  dismissButtonLabel?: string;
  color?: ColorValue;
  elementColors?: DatePickerElementColors & TimePickerElementColors;
  onDateSelected?: (date: Date) => void;
  onDismissRequest: () => void;
};

type NativeTimePickerDialogProps = Omit<
  TimePickerDialogProps,
  'onDateSelected' | 'onDismissRequest' | 'initialDate' | 'elementColors'
> & {
  initialDate?: number | null;
  elementColors?: DatePickerElementColors & TimePickerElementColors;
} & ViewEvent<'onDateSelected', { date: Date }> &
  ViewEvent<'onDismissRequest', void>;

const TimePickerDialogNativeView: React.ComponentType<NativeTimePickerDialogProps> =
  requireNativeView('ExpoUI', 'TimePickerDialogView');

export function TimePickerDialog(props: TimePickerDialogProps) {
  const { initialDate, elementColors, onDismissRequest, ...rest } = props;
  const nativeProps: NativeTimePickerDialogProps = {
    ...rest,
    initialDate: initialDate ? new Date(initialDate).getTime() : null,
    onDateSelected: ({ nativeEvent: { date } }) => {
      props.onDateSelected?.(new Date(date));
    },
    onDismissRequest,
    ...(elementColors != null ? { elementColors } : undefined),
  };
  return <TimePickerDialogNativeView {...nativeProps} />;
}
