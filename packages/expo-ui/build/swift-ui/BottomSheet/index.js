import { requireNativeView } from 'expo';
import { Dimensions, View } from 'react-native';
const BottomSheetNativeView = requireNativeView('ExpoUI', 'BottomSheetView');
export function transformBottomSheetProps(props) {
    return {
        ...props,
        onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
            props?.onIsOpenedChange?.(isOpened);
        },
    };
}
export function BottomSheet(props) {
    const { width } = Dimensions.get('window');
    return (<View>
      <BottomSheetNativeView style={{ position: 'absolute', width }} {...transformBottomSheetProps(props)}/>
    </View>);
}
//# sourceMappingURL=index.js.map