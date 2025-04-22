import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle, StyleSheet, PixelRatio } from 'react-native';

import { ViewEvent } from '../../types';

export type IOSVariant = 'wheel' | 'automatic' | 'graphical' | 'compact';

export type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';

export type DateTimePickerProps = {
  /**
   * The initial date to display on the picker.
   */
  initialDate?: string | null;
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
   * Optional style to apply to the component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The tint color to use on the picker elements.
   */
  color?: string;
};

type NativeDatePickerProps = Omit<DateTimePickerProps, 'variant' | 'onDateSelected'> & {
  variant?: IOSVariant;
} & ViewEvent<'onDateSelected', { date: Date }>;

/**
 * @hidden
 */
export function transformDateTimePickerProps(props: DateTimePickerProps): NativeDatePickerProps {
  const { variant, ...rest } = props;
  const { minWidth, minHeight, ...restStyle } = StyleSheet.flatten(rest.style) || {};

  // On Android, the picker’s minWidth and minHeight must be 12dp.
  // Otherwise, the picker will crash the app.
  const minSize = PixelRatio.getPixelSizeForLayoutSize(12);

  // However, when users pass the minWidth and minHeight props, we trust that they know what they are doing.
  const parsedMinWidth = minWidth ? minSize : undefined;
  const parsedMinHeight = minHeight ? minSize : undefined;

  return {
    ...rest,
    onDateSelected: ({ nativeEvent: { date } }) => {
      props?.onDateSelected?.(new Date(date));
    },
    variant,
    style: [restStyle, { minWidth: parsedMinWidth, minHeight: parsedMinHeight }],
  };
}

const DatePickerNativeView: React.ComponentType<NativeDatePickerProps> = requireNativeView(
  'ExpoUI',
  'DateTimePickerView'
);

/**
 * Renders a `DateTimePicker` component.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  return <DatePickerNativeView {...transformDateTimePickerProps(props)} />;
}
