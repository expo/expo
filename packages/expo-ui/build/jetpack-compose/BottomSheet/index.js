import { requireNativeView } from 'expo';
const BottomSheetNativeView = requireNativeView('ExpoUI', 'BottomSheetView');
function transformBottomSheetProps(props) {
    return {
        ...props,
        onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
            console.log('JEROEN', "React event received!");
            props.onIsOpenedChange(isOpened);
        },
    };
}
export function BottomSheet(props) {
    return <BottomSheetNativeView {...transformBottomSheetProps(props)}/>;
}
//# sourceMappingURL=index.js.map