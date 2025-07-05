import { StyleProp, ViewStyle } from 'react-native';
import { ViewEvent } from '../../types';
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
export type NativeSecureFieldProps = Omit<SecureFieldProps, 'onChangeText'> & {} & ViewEvent<'onValueChanged', {
    value: string;
}>;
/**
 * Renders a `SecureField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export declare function SecureField(props: SecureFieldProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
/**
 * `<SecureField>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function SecureFieldPrimitive(props: SecureFieldProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map