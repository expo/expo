import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

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
} & CommonViewModifierProps;

type NativeDatePickerProps = Omit<DateTimePickerProps, 'variant' | 'onDateSelected'> & {
  variant?: IOSVariant;
} & ViewEvent<'onDateSelected', { date: Date }>;

function transformDateTimePickerProps(props: DateTimePickerProps): NativeDatePickerProps {
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
