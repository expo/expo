import { requireNativeView } from 'expo';
import { Platform } from 'react-native';
const ContainerNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIContainer') : null;
export function Container(props) {
    if (!ContainerNativeView) {
        return null;
    }
    return <ContainerNativeView {...props}/>;
}
const FormNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIForm') : null;
export function Form(props) {
    if (!FormNativeView) {
        return null;
    }
    return <FormNativeView {...props}/>;
}
const SectionNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUISection') : null;
export function Section(props) {
    if (!SectionNativeView) {
        return null;
    }
    return <SectionNativeView {...props}/>;
}
const ButtonNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIButton') : null;
function transformButtonProps(props) {
    const { children, onPress, ...restProps } = props;
    return {
        ...restProps,
        text: children?.toString() ?? '',
        onButtonPressed: onPress,
    };
}
export function Button(props) {
    if (!ButtonNativeView) {
        return null;
    }
    return <ButtonNativeView {...transformButtonProps(props)}/>;
}
const PickerNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIPicker') : null;
export function Picker(props) {
    if (!PickerNativeView) {
        return null;
    }
    return <PickerNativeView {...props}/>;
}
const SwitchNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUISwitch') : null;
function transformSwitchProps(props) {
    const { onValueChange, ...restProps } = props;
    return {
        ...restProps,
        onValueChange: (event) => onValueChange(event.nativeEvent.value),
    };
}
export function Switch(props) {
    if (!SwitchNativeView) {
        return null;
    }
    return <SwitchNativeView {...transformSwitchProps(props)}/>;
}
const TextNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIText') : null;
function transformTextProps(props) {
    const { children, ...restProps } = props;
    return {
        ...restProps,
        text: children ?? '',
    };
}
export function Text(props) {
    if (!TextNativeView) {
        return null;
    }
    return <TextNativeView {...transformTextProps(props)}/>;
}
const HStackNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIHStack') : null;
export function HStack(props) {
    if (!HStackNativeView) {
        return null;
    }
    return <HStackNativeView {...props}/>;
}
const VStackNativeView = Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'SwiftUIVStack') : null;
export function VStack(props) {
    if (!VStackNativeView) {
        return null;
    }
    return <VStackNativeView {...props}/>;
}
//#endregion
//# sourceMappingURL=Generated.js.map