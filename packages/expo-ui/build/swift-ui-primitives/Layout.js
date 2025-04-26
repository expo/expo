import { requireNativeView } from 'expo';
const HStackNativeView = requireNativeView('ExpoUI', 'HStackView');
export function HStack(props) {
    return <HStackNativeView {...props}/>;
}
const VStackNativeView = requireNativeView('ExpoUI', 'VStackView');
export function VStack(props) {
    return <VStackNativeView {...props}/>;
}
//#endregion
//# sourceMappingURL=Layout.js.map