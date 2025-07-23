import { requireNativeView } from 'expo';
import { Host } from '../Host';
const ListNativeView = requireNativeView('ExpoUI', 'ListView');
function transformListProps(props) {
    return {
        ...props,
        onDeleteItem: ({ nativeEvent: { index } }) => props?.onDeleteItem?.(index),
        onMoveItem: ({ nativeEvent: { from, to } }) => props?.onMoveItem?.(from, to),
        onSelectionChange: ({ nativeEvent: { selection } }) => props?.onSelectionChange?.(selection),
    };
}
/**
 * `<List>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ListPrimitive(props) {
    const { children, ...nativeProps } = props;
    if (!ListNativeView) {
        return null;
    }
    return <ListNativeView {...transformListProps(nativeProps)}>{children}</ListNativeView>;
}
/**
 * A list component that renders its children using a native SwiftUI list.
 * @param {ListProps} props - The properties for the list component.
 * @returns {JSX.Element | null} The rendered list with its children or null if the platform is unsupported.
 * @platform ios
 */
export function List(props) {
    return (<Host style={[props.style, { flex: 1 }]} matchContents>
      <ListPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map