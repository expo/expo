import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
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

type NativeDatePickerProps = Omit<DatePickerProps, 'selection' | 'range' | 'onDateChange'> & {
  selection?: string;
  range?: { start?: string; end?: string };
  onDateChange?: (event: NativeSyntheticEvent<{ date: Date }>) => void;
};

function transformDatePickerProps(props: DatePickerProps): NativeDatePickerProps {
  const { modifiers, onDateChange, selection, range, ...rest } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...rest,
    selection: selection?.toISOString(),
    range: range
      ? {
          start: range.start?.toISOString(),
          end: range.end?.toISOString(),
        }
      : undefined,
    onDateChange: onDateChange
      ? ({ nativeEvent: { date } }) => {
          onDateChange(new Date(date));
        }
      : undefined,
  };
}

const DatePickerNativeView: React.ComponentType<NativeDatePickerProps> = requireNativeView(
  'ExpoUI',
  'DatePickerView'
);

/**
 * Renders a SwiftUI `DatePicker` component.
 */
export function DatePicker(props: DatePickerProps) {
  return <DatePickerNativeView {...transformDatePickerProps(props)} />;
}
