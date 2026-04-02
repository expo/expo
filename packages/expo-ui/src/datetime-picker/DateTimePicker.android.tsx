import { buildEvent, buildChangeEvent, type DateTimePickerProps } from './types';
import {
  DateTimePicker as AndroidPicker,
  DatePickerDialog as AndroidDatePickerDialog,
  TimePickerDialog as AndroidTimePickerDialog,
  type DateTimePickerProps as AndroidDateTimePickerProps,
} from '../jetpack-compose/DatePicker';
import { Host } from '../jetpack-compose/Host';

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
    if (onValueChange) {
      onValueChange(buildChangeEvent(date), date);
    } else {
      onChange?.(buildEvent(date), date);
    }
  };

  const selectableDates =
    minimumDate || maximumDate ? { start: minimumDate, end: maximumDate } : undefined;

  const dialogProps = {
    initialDate: value.toISOString(),
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
        initialDate={value.toISOString()}
        displayedComponents={modeToDisplayedComponents(mode)}
        variant={displayToAndroidVariant(display)}
        selectableDates={selectableDates}
        is24Hour={is24Hour}
        color={accentColor}
        onDateSelected={onDateSelected}
        showVariantToggle={false}
        {...(testID ? { testID } : undefined)}
      />
    </Host>
  );
}
