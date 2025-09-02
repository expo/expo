import { requireNativeView } from 'expo';
import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const ListNativeView = requireNativeView('ExpoUI', 'ListView');
function transformListProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        onDeleteItem: ({ nativeEvent: { index } }) => props?.onDeleteItem?.(index),
        onMoveItem: ({ nativeEvent: { from, to } }) => props?.onMoveItem?.(from, to),
        onSelectionChange: ({ nativeEvent: { selection } }) => props?.onSelectionChange?.(selection),
    };
}
/**
 * A list component that renders its children using a native SwiftUI list.
 * @param {ListProps} props - The properties for the list component.
 * @returns {JSX.Element | null} The rendered list with its children or null if the platform is unsupported.
 * @platform ios
 */
export function List(props) {
    const { children, ...nativeProps } = props;
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="List"/>;
    }
    return (<ListNativeView {...transformListProps(nativeProps)}>
      {markChildrenAsNestedInSwiftUI(children)}
    </ListNativeView>);
}
//# sourceMappingURL=index.js.map