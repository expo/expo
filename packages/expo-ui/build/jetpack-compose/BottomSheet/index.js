import { requireNativeView } from 'expo';
import React from "react";
const BottomSheetNativeView = requireNativeView('ExpoUI', 'BottomSheetView');
function transformBottomSheetProps(props) {
    return {
        ...props,
        skipPartiallyExpanded: props.skipPartiallyExpanded ?? false,
        onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
            props.onIsOpenedChange(isOpened);
        },
    };
}
export function BottomSheet(props) {
    return <BottomSheetNativeView {...transformBottomSheetProps(props)}/>;
}
//# sourceMappingURL=index.js.map