import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../types';
import { Host } from '../Host';

/**
 * @hidden Not used anywhere yet.
 */
export type TextInputRole = 'default' | 'cancel' | 'destructive';

export type TextInputProps = {
  /**
   * Initial value that the TextInput displays when being mounted. As the TextInput is an uncontrolled component, change the key prop if you need to change the text value.
   */
  defaultValue?: string;
  /**
   * A callback triggered when user types in text into the TextInput.
   */
  onChangeText: (value: string) => void;
  /**
   * The string that will be rendered before text input has been entered.
   */
  placeholder?: string;
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
    { value: string }
  >;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const TextInputNativeView: React.ComponentType<NativeTextInputProps> = requireNativeView(
  'ExpoUI',
  'TextInputView'
);

/**
 * @hidden
 */
function transformTextInputProps(props: TextInputProps): NativeTextInputProps {
  return {
    ...props,
    onValueChanged: (event) => {
      props.onChangeText?.(event.nativeEvent.value);
    },
  };
}

/**
 * Renders a `TextInput` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function TextInput(props: TextInputProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <TextInputPrimitive {...props} />
    </Host>
  );
}

/**
 * `<TextInput>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function TextInputPrimitive(props: TextInputProps) {
  return <TextInputNativeView {...transformTextInputProps(props)} />;
}
