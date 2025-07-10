import { requireNativeView } from 'expo';
import { Dimensions } from 'react-native';
import { Host } from '../Host';
const BottomSheetNativeView = requireNativeView('ExpoUI', 'BottomSheetView');
export function transformBottomSheetProps(props) {
    return {
        ...props,
        onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
            props?.onIsOpenedChange?.(isOpened);
        },
    };
}
/**
 * `<BottomSheet>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function BottomSheetPrimitive(props) {
    return <BottomSheetNativeView {...transformBottomSheetProps(props)}/>;
}
export function BottomSheet(props) {
    const { width } = Dimensions.get('window');
    return (<Host style={{ position: 'absolute', width }}>
      <BottomSheetPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map