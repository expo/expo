import { requireNativeView } from 'expo';

import { ListProps, NativeListProps } from '.';

const ListNativeView: React.ComponentType<NativeListProps> | null =
  requireNativeView<NativeListProps>('ExpoUI', 'ListView');

function transformListProps(props: Omit<ListProps, 'children'>): Omit<NativeListProps, 'children'> {
  return {
    ...props,
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
export function List(props: ListProps) {
  const { children, ...nativeProps } = props;

  if (!ListNativeView) {
    return null;
  }

  return (
    <ListNativeView {...transformListProps(nativeProps)} style={[props.style, { flex: 1 }]}>
      {children}
    </ListNativeView>
  );
}
