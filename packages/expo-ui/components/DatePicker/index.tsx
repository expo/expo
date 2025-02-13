import { requireNativeView } from 'expo';
import { Platform } from 'expo-modules-core';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type AndroidVariant = 'picker' | 'input';

type IOSVariant = 'wheel' | 'automatic' | 'graphical' | 'compact';

type DisplayedComponents = 'date' | 'hourAndMinute' | 'dateAndTime';

/**
 * Props for the DatePicker component.
 */
export type DatePickerProps = {
  /**
   * The intial date to display on the picker.
   */
  initialDate?: string | null;
  /**
   * A title displayed on the picker  on iOS.
   * @platform iOS
   */
  title?: string;
  /**
   * Callback function that is called when a date is selected.
   */
  onDateSelected?: (date: Date) => void;
  /**
   * The variant of the picker, which determines its appearance and behavior.
   * @platform iOS
   * @default 'automatic'
   */
  iosVariant?: IOSVariant;
  /**
   * The variant of the picker, which determines its appearance and behavior.
   * @platform android
   * @default 'picker'
   */
  androidVariant?: AndroidVariant;
  /**
   * Show to button to toggle between variants on Android.
   * @platform android
   * @default 'true'
   */
  showVariantToggle?: boolean;
  /**
   * The components that the picker should display.
   * On iOS, you can have a picker that selects both date and time.
   * On Android, you can have a picker that selects just the date or just the time.
   * `dateAndTime` is only available on iOS and will result in a date picker on Android.
   * @default ['date']
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
  /**
   * Determines what format the clock should be displayed in on Android.
   * @platform android
   * @default true
   */
  is24Hour?: boolean;
};

type NativeDatePickerProps = Omit<DatePickerProps, 'iosVariant' | 'androidVariant'> & {
  variant?: IOSVariant | AndroidVariant;
};

export function transformDatePickerProps(props: DatePickerProps): NativeDatePickerProps {
  const { iosVariant, androidVariant, ...rest } = props;
  return {
    ...rest,
    variant: Platform.OS === 'ios' ? iosVariant : androidVariant,
  };
}

const DatePickerNativeView: React.ComponentType<NativeDatePickerProps> = requireNativeView(
  'ExpoUI',
  'DateTimePickerView'
);

function useNativeEvent(userHandler?: (date: Date) => void) {
  return React.useCallback(
    (event) => {
      userHandler?.(new Date(event.nativeEvent.date));
    },
    [userHandler]
  );
}

export function DateTimePicker({ onDateSelected, ...props }: DatePickerProps) {
  const onNativeDateSelected = useNativeEvent(onDateSelected);
  return (
    <DatePickerNativeView
      onDateSelected={onNativeDateSelected}
      {...transformDatePickerProps(props)}
    />
  );
}
