import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const BottomSheetNativeView = requireNativeView('ExpoUI', 'BottomSheetView');
function transformBottomSheetProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
            props?.onIsOpenedChange?.(isOpened);
        },
    };
}
export function BottomSheet(props) {
    return <BottomSheetNativeView {...transformBottomSheetProps(props)}/>;
}
//# sourceMappingURL=index.js.map