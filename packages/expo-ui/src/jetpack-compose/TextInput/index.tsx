import { requireNativeView } from 'expo';
import { Ref } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { ExpoModifier, ViewEvent } from '../../types';

/**
 * @hidden Not used anywhere yet.
 */
export type TextInputRole = 'default' | 'cancel' | 'destructive';

export type TextInputRef = {
  setText: (newText: string) => Promise<void>;
};

export type TextInputProps = {
  /**
   * Can be used for imperatively setting text on the TextInput component.
   */
  ref?: Ref<TextInputRef>;
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
   * - password
   * - password-numeric
   *
   * @default default
   */
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'ascii-capable'
    | 'url'
    | 'decimal-pad';
  /**
   * If true, autocorrection is enabled.
   * @default true
   */
  autocorrection?: boolean;
  /**
   * Options to request software keyboard to capitalize the text. Applies to languages which has upper-case and lower-case letters.
   *
   * Available options:
   * - `characters`: Capitalize all characters.
   * - `none`: Do not auto-capitalize text.
   * - `sentences`: Capitalize the first character of each sentence.
   * - `unspecified`: Capitalization behavior is not specified.
   * - `words`: Capitalize the first character of every word.
   * @default none
   * @platform android
   */
  autoCapitalize?: 'characters' | 'none' | 'sentences' | 'unspecified' | 'words';

  /** Modifiers for the component */
  modifiers?: ExpoModifier[];
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
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

/**
 * Renders a `TextInput` component.
 */
export function TextInput(props: TextInputProps) {
  return <TextInputNativeView {...transformTextInputProps(props)} style={props.style} />;
}
