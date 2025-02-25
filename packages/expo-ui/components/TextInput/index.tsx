import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../src';

export type TextInputRole = 'default' | 'cancel' | 'destructive';

/**
 * Props for the TextInput component.
 */
export type TextInputProps = {
  /**
   * Additional styles to apply to the TextInput.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Initial value that the TextInput displays when being mounted. As the TextInput is an uncontrolled component, change the key prop if you need to change the text value.
   */
  defaultValue?: string;
  /**
   * A callback triggered when user types in text into the TextInput.
   */
  onChangeText: (value: string) => void;
  /**
   * If true, the text input can be multiple lines.
   * While the content will wrap, there's no keyboard button to insert a new line.
   */
  multiline?: boolean;
  /**
   * The number of lines to display when `multiline` is set to true.
   * If the number of lines in the view is above this number, the view scrolls.
   * @default undefined, which means unlimited lines.
   */
  numberOfLines?: number;
  /**
   * Determines which keyboard to open, e.g., numeric.
   * @default default
   */
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'ascii-capable'
    | 'numbers-and-punctuation'
    | 'url'
    | 'name-phone-pad'
    | 'decimal-pad'
    | 'twitter'
    | 'web-search'
    | 'ascii-capable-number-pad';
  /**
   * If true, autocorrection is enabled.
   * @default true
   */
  autocorrection?: boolean;
};

export type NativeTextInputProps = Omit<TextInputProps, 'onChangeText'> & {} & ViewEvent<
    'onValueChanged',
    { value: string; eventIndex: number }
  >;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const TextInputNativeView: React.ComponentType<NativeTextInputProps> = requireNativeView(
  'ExpoUI',
  'TextInputView'
);

function transformTextInputProps(props: TextInputProps): NativeTextInputProps {
  return {
    ...props,
    onValueChanged: (e) => {
      props.onChangeText?.(e.nativeEvent.value);
    },
  };
}

export function TextInput(props: TextInputProps) {
  return <TextInputNativeView {...transformTextInputProps(props)} style={props.style} />;
}
