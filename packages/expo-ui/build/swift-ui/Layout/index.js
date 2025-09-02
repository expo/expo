import { requireNativeView } from 'expo';
import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
function transformNativeProps(props) {
    const { onPress, modifiers, children, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        children: markChildrenAsNestedInSwiftUI(props.children),
        ...restProps,
        ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
    };
}
const HStackNativeView = requireNativeView('ExpoUI', 'HStackView');
export function HStack(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="HStack"/>;
    }
    return <HStackNativeView {...transformNativeProps(props)}/>;
}
const VStackNativeView = requireNativeView('ExpoUI', 'VStackView');
export function VStack(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="VStack"/>;
    }
    return <VStackNativeView {...transformNativeProps(props)}/>;
}
const GroupNativeView = requireNativeView('ExpoUI', 'GroupView');
function transformGroupProps(props) {
    const { onPress, modifiers, children, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        children: markChildrenAsNestedInSwiftUI(props.children),
        ...restProps,
        ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
    };
}
export function Group(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Group"/>;
    }
    return <GroupNativeView {...transformGroupProps(props)}/>;
}
//#endregion
//# sourceMappingURL=index.js.map