import { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

export type CheckboxEvent = NativeSyntheticEvent<{ target: number; value: boolean }>;

export interface CheckboxProps extends ViewProps {
  /** The value of the checkbox. If true the checkbox will be turned on. Default value is false. */
  value?: boolean;
  /** If true the user won't be able to toggle the checkbox. Default value is false. */
  disabled?: boolean;
  /** Sets the tint color of the checkbox */
  color?: ColorValue;
  /** Used in case the props change removes the component. */
  onChange?: (event: CheckboxEvent) => void;
  /** Invoked with the new value when the value changes. */
  onValueChange?: (value: boolean) => void;
}

export type CheckboxComponent = React.FC<CheckboxProps> & {
  isAvailableAsync: () => Promise<boolean>;
};
