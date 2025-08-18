import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
function transformNativeProps(props) {
    const { onPress, modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
    };
}
const HStackNativeView = requireNativeView('ExpoUI', 'HStackView');
export function HStack(props) {
    return <HStackNativeView {...transformNativeProps(props)}/>;
}
const VStackNativeView = requireNativeView('ExpoUI', 'VStackView');
export function VStack(props) {
    return <VStackNativeView {...transformNativeProps(props)}/>;
}
const GroupNativeView = requireNativeView('ExpoUI', 'GroupView');
function transformGroupProps(props) {
    const { onPress, modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
    };
}
export function Group(props) {
    return <GroupNativeView {...transformGroupProps(props)}/>;
}
//#endregion
//# sourceMappingURL=index.js.map