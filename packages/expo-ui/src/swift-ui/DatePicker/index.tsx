import { requireNativeView } from 'expo';
import * as React from 'react';
import type { ColorValue } from 'react-native';

import { type ViewEvent } from '../../types';
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
  onDateChange?: (event: { nativeEvent: { date: Date } }) => void;
  /**
   * Children to use as a custom label.
   */
  children?: React.ReactNode;
} & CommonViewModifierProps;

type NativeDatePickerProps = Omit<DatePickerProps, 'selection' | 'range'> & {
  selection?: string;
  range?: { start?: string; end?: string };
};

function transformDatePickerProps(props: DatePickerProps): NativeDatePickerProps {
  const { modifiers, selection, range, ...rest } = props;
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

type NativeDateTimePickerProps = Omit<DateTimePickerProps, 'variant' | 'onDateSelected'> & {
  variant?: IOSVariant;
} & ViewEvent<'onDateSelected', { date: Date }>;

function transformDateTimePickerProps(props: DateTimePickerProps): NativeDateTimePickerProps {
  const { variant, modifiers, ...rest } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...rest,
    onDateSelected: ({ nativeEvent: { date } }) => {
      props?.onDateSelected?.(new Date(date));
    },
    variant,
  };
}

const DateTimePickerNativeView: React.ComponentType<NativeDateTimePickerProps> = requireNativeView(
  'ExpoUI',
  'DateTimePickerView'
);

/**
 * Renders a `DateTimePicker` component.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  return <DateTimePickerNativeView {...transformDateTimePickerProps(props)} />;
}
