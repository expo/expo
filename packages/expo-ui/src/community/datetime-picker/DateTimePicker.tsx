import { buildEvent, buildChangeEvent, type DateTimePickerProps } from './types';
import { DatePicker, type DatePickerProps } from '../../swift-ui/DatePicker';
import { Host } from '../../swift-ui/Host';
import { disabled as disabledModifier, type ModifierConfig, tint } from '../../swift-ui/modifiers';
import { datePickerStyle } from '../../swift-ui/modifiers/datePickerStyle';
import { environment } from '../../swift-ui/modifiers/environment';

type DatePickerStyleType = 'automatic' | 'compact' | 'graphical' | 'wheel';

function modeToDisplayedComponents(
  mode: DateTimePickerProps['mode']
): DatePickerProps['displayedComponents'] {
  switch (mode) {
    case 'time':
      return ['hourAndMinute'];
    case 'datetime':
      return ['date', 'hourAndMinute'];
    case 'date':
    default:
      return ['date'];
  }
}

function displayToDatePickerStyle(display: DateTimePickerProps['display']): DatePickerStyleType {
  switch (display) {
    case 'spinner':
      return 'wheel';
    case 'compact':
      return 'compact';
    case 'inline':
      return 'graphical';
    default:
      return 'automatic';
  }
}

export function DateTimePicker(props: DateTimePickerProps) {
  const {
    value,
    onChange,
    onValueChange,
    mode = 'date',
    minimumDate,
    maximumDate,
    display = 'default',
    testID,
    style,
    accentColor,
    disabled,
    locale,
    themeVariant,
    timeZoneName,
  } = props;

  const pickerStyle = displayToDatePickerStyle(display);

  // The compact style hugs its content, so the Host must match it
  // on both axes, otherwise it collapses to 0 width under a non-stretch parent like
  // `alignItems: 'center'` https://github.com/expo/expo/issues/46904.
  const isCompactStyle = pickerStyle === 'compact' || pickerStyle === 'automatic';

  const modifiers: ModifierConfig[] = [datePickerStyle(pickerStyle)];
  if (accentColor) {
    modifiers.push(tint(accentColor));
  }
  if (disabled != null) {
    modifiers.push(disabledModifier(disabled));
  }
  if (locale) {
    modifiers.push(environment('locale', locale));
  }
  if (themeVariant) {
    modifiers.push(environment('colorScheme', themeVariant));
  }
  if (timeZoneName) {
    modifiers.push(environment('timeZone', timeZoneName));
  }

  const iosProps: DatePickerProps = {
    selection: value,
    displayedComponents: modeToDisplayedComponents(mode),
    range: minimumDate || maximumDate ? { start: minimumDate, end: maximumDate } : undefined,
    onDateChange: (date: Date) => {
      if (onValueChange) {
        onValueChange(buildChangeEvent(date), date);
      } else {
        onChange?.(buildEvent(date), date);
      }
    },
    modifiers,
    testID,
  };

  return (
    <Host
      matchContents={isCompactStyle ? true : { vertical: true }}
      style={style}
      ignoreSafeArea="all">
      <DatePicker {...iosProps} />
    </Host>
  );
}
