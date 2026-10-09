import {
  DateTimePicker as AndroidPicker,
  DatePickerDialog as AndroidDatePickerDialog,
  TimePickerDialog as AndroidTimePickerDialog,
  type DateTimePickerProps as AndroidDateTimePickerProps,
} from '../../jetpack-compose/DatePicker';
import { Host } from '../../jetpack-compose/Host';
import { buildEvent, buildChangeEvent, type DateTimePickerProps } from './types';
import { localDateToUtcDayISOString, utcDayToLocalDate } from './utils';

function modeToDisplayedComponents(
  mode: DateTimePickerProps['mode']
): AndroidDateTimePickerProps['displayedComponents'] {
  switch (mode) {
    case 'time':
      return 'hourAndMinute';
    case 'datetime':
      // Android has no inline datetime picker — fall back to date only.
      return 'date';
    case 'date':
    default:
      return 'date';
  }
}

function displayToAndroidVariant(
  display: DateTimePickerProps['display']
): AndroidDateTimePickerProps['variant'] {
  switch (display) {
    case 'spinner':
      return 'input';
    default:
      return 'picker';
  }
}

export function DateTimePicker(props: DateTimePickerProps) {
  const {
    value,
    onChange,
    onValueChange,
    onDismiss: onDismissProp,
    mode = 'date',
    minimumDate,
    maximumDate,
    display = 'default',
    is24Hour,
    testID,
    style,
    accentColor,
    presentation = 'dialog',
    positiveButton,
    negativeButton,
  } = props;

  // Material3 date pickers work in UTC days, while `value` and the reported date are local —
  // matching `@react-native-community/datetimepicker`. Send `value`'s local calendar day as a UTC
  // day and convert the picked UTC day back, keeping `value`'s time of day. The native side
  // already converts `minimumDate`/`maximumDate` by their local calendar day. Time pickers read
  // local hours from the instant, so they take `value` unchanged.
  const usesDateComponents = mode !== 'time';
  const initialDate = usesDateComponents ? localDateToUtcDayISOString(value) : value.toISOString();

  const onDismissed = () => {
    if (onDismissProp) {
      onDismissProp();
    } else {
      onChange?.(
        {
          type: 'dismissed',
          nativeEvent: {
            timestamp: value.getTime(),
            utcOffset: -value.getTimezoneOffset(),
          },
        },
        value
      );
    }
  };

  const onDateSelected = (date: Date) => {
    const selected = usesDateComponents ? utcDayToLocalDate(date, value) : date;
    if (onValueChange) {
      onValueChange(buildChangeEvent(selected), selected);
    } else {
      onChange?.(buildEvent(selected), selected);
    }
  };

  const selectableDates =
    minimumDate || maximumDate ? { start: minimumDate, end: maximumDate } : undefined;

  const dialogProps = {
    initialDate,
    color: accentColor,
    confirmButtonLabel: positiveButton?.label,
    dismissButtonLabel: negativeButton?.label,
    onDateSelected,
    onDismissRequest: onDismissed,
  } as const;

  if (presentation === 'dialog') {
    if (mode === 'time') {
      return (
        <Host style={style}>
          <AndroidTimePickerDialog {...dialogProps} is24Hour={is24Hour} />
        </Host>
      );
    }
    return (
      <Host style={style}>
        <AndroidDatePickerDialog
          {...dialogProps}
          variant={displayToAndroidVariant(display)}
          selectableDates={selectableDates}
        />
      </Host>
    );
  }

  return (
    <Host matchContents={{ vertical: true }} style={style}>
      <AndroidPicker
        initialDate={initialDate}
        displayedComponents={modeToDisplayedComponents(mode)}
        variant={displayToAndroidVariant(display)}
        selectableDates={selectableDates}
        is24Hour={is24Hour}
        color={accentColor}
        onDateSelected={onDateSelected}
        showVariantToggle={false}
        // Match iOS, where the inline picker has no label: hide Material 3's "Select date" title
        // and its selected-date headline.
        showTitle={false}
        showHeadline={false}
        {...(testID ? { testID } : undefined)}
      />
    </Host>
  );
}
