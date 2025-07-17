import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../types';
import { Host } from '../Host';

/**
 * Determines which keyboard to open. For example, `'numeric'`.
 *
 * Available options:
 * - default
 * - numeric
 * - email-address
 * - phone-pad
 * - decimal-pad
 * - ascii-capable
 * - url
 * - numbers-and-punctuation
 * - name-phone-pad
 * - twitter
 * - web-search
 * - ascii-capable-number-pad
 *
 * @default default
 */
export type TextFieldKeyboardType =
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

export type TextFieldProps = {
  /**
   * Initial value that the TextField displays when being mounted. As the TextField is an uncontrolled component, change the key prop if you need to change the text value.
   */
  defaultValue?: string;
  /**
   * A text that is displayed when the field is empty.
   */
  placeholder?: string;
  /**
   * A callback triggered when user types in text into the TextField.
   */
  onChangeText: (value: string) => void;
  /**
   * If true, the text input can be multiple lines.
   * While the content will wrap, there's no keyboard button to insert a new line.
   */
  multiline?: boolean;
  allowNewlines?: boolean;
  /**
   * The number of lines to display when `multiline` is set to true.
   * If the number of lines in the view is above this number, the view scrolls.
   * @default undefined, which means unlimited lines.
   */
  numberOfLines?: number;

  keyboardType?: TextFieldKeyboardType;
  /**
   * If true, autocorrection is enabled.
   * @default true
   */
  autocorrection?: boolean;
};

export type NativeTextFieldProps = Omit<TextFieldProps, 'onChangeText'> & {} & ViewEvent<
    'onValueChanged',
    { value: string }
  >;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const TextFieldNativeView: React.ComponentType<NativeTextFieldProps> = requireNativeView(
  'ExpoUI',
  'TextFieldView'
);

/**
 * @hidden
 */
function transformTextFieldProps(props: TextFieldProps): NativeTextFieldProps {
  return {
    ...props,
    onValueChanged: (event) => {
      props.onChangeText?.(event.nativeEvent.value);
    },
  };
}

/**
 * Renders a `TextField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function TextField(props: TextFieldProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <TextFieldPrimitive {...props} />
    </Host>
  );
}

/**
 * `<TextField>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function TextFieldPrimitive(props: TextFieldProps) {
  return <TextFieldNativeView {...transformTextFieldProps(props)} />;
}
