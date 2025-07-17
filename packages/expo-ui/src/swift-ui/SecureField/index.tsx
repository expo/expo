import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { ViewEvent } from '../../types';
import { Host } from '../Host';
import { TextFieldKeyboardType } from '../TextField';

export type SecureFieldProps = {
  /**
   * Initial value that the SecureField displays when being mounted. As the SecureField is an uncontrolled component, change the key prop if you need to change the text value.
   */
  defaultValue?: string;
  /**
   * A text that is displayed when the field is empty.
   */
  placeholder?: string;
  /**
   * A callback triggered when user types in text into the SecureField.
   */
  onChangeText: (value: string) => void;
  keyboardType?: TextFieldKeyboardType;
};

export type NativeSecureFieldProps = Omit<SecureFieldProps, 'onChangeText'> & {} & ViewEvent<
    'onValueChanged',
    { value: string }
  >;

// We have to work around the `role` and `onPress` props being reserved by React Native.
const SecureFieldNativeView: React.ComponentType<NativeSecureFieldProps> = requireNativeView(
  'ExpoUI',
  'SecureFieldView'
);

/**
 * @hidden
 */
function transformSecureFieldProps(props: SecureFieldProps): NativeSecureFieldProps {
  return {
    ...props,
    onValueChanged: (event) => {
      props.onChangeText?.(event.nativeEvent.value);
    },
  };
}

/**
 * Renders a `SecureField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function SecureField(props: SecureFieldProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <SecureFieldPrimitive {...props} />
    </Host>
  );
}

/**
 * `<SecureField>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function SecureFieldPrimitive(props: SecureFieldProps) {
  return <SecureFieldNativeView {...transformSecureFieldProps(props)} />;
}
