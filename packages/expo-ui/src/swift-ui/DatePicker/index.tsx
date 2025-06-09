import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle, StyleSheet, PixelRatio } from 'react-native';

import { ViewEvent } from '../../types';
import { Host } from '../Host';

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
  return {
    ...rest,
    onDateSelected: ({ nativeEvent: { date } }) => {
      props?.onDateSelected?.(new Date(date));
    },
    variant,
  };
}

function transformDateTimePickerStyle(
  style: StyleProp<ViewStyle> | undefined
): StyleProp<ViewStyle> {
  const { minWidth, minHeight, ...restStyle } = StyleSheet.flatten(style) || {};

  // On Android, the picker’s minWidth and minHeight must be 12dp.
  // Otherwise, the picker will crash the app.
  const minSize = PixelRatio.getPixelSizeForLayoutSize(12);

  // However, when users pass the minWidth and minHeight props, we trust that they know what they are doing.
  const parsedMinWidth = minWidth ? minSize : undefined;
  const parsedMinHeight = minHeight ? minSize : undefined;

  return [restStyle, { minWidth: parsedMinWidth, minHeight: parsedMinHeight }];
}

const DatePickerNativeView: React.ComponentType<NativeDatePickerProps> = requireNativeView(
  'ExpoUI',
  'DateTimePickerView'
);

/**
 * `<DateTimePicker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function DateTimePickerPrimitive(props: DateTimePickerProps) {
  return <DatePickerNativeView {...transformDateTimePickerProps(props)} />;
}

/**
 * Renders a `DateTimePicker` component.
 */
export function DateTimePicker(props: DateTimePickerProps & { style?: StyleProp<ViewStyle> }) {
  const transformedStyle = transformDateTimePickerStyle(props.style);
  return (
    <Host style={transformedStyle} matchContents>
      <DateTimePickerPrimitive {...props} />
    </Host>
  );
}
