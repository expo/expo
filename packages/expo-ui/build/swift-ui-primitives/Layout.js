import { requireNativeView } from 'expo';
function transformNativeProps(props) {
    const { onPress, ...restProps } = props;
    return {
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
export function Group(props) {
    return <GroupNativeView {...transformNativeProps(props)}/>;
}
//#endregion
//# sourceMappingURL=Layout.js.map