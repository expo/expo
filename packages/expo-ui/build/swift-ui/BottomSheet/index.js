import { requireNativeView } from 'expo';
import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const BottomSheetNativeView = requireNativeView('ExpoUI', 'BottomSheetView');
function transformBottomSheetProps(props) {
    const { modifiers, children, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        children: markChildrenAsNestedInSwiftUI(children),
        ...restProps,
        onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
            props?.onIsOpenedChange?.(isOpened);
        },
    };
}
export function BottomSheet(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="BottomSheet"/>;
    }
    return <BottomSheetNativeView {...transformBottomSheetProps(props)}/>;
}
//# sourceMappingURL=index.js.map