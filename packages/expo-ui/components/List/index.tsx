import { requireNativeView } from 'expo';
import { StyleProp, View, ViewStyle } from 'react-native';
import { ViewEvent } from '../../src';

export type ListStyle = 'automatic' | 'plain' | 'inset' | 'insetGrouped' | 'grouped' | 'sidebar';

export interface ListProps {
  /**
   * Custom style for the container wrapping the list.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * One of the predefined ListStyle types in SwiftUI.
   * @default 'automatic'
   */
  listStyle?: ListStyle;

  /**
   * Allows the selection of list items.
   * @default false
   */
  selectEnabled?: boolean;

  /**
   * Enables reordering of list items.
   * @default false
   */
  moveEnabled?: boolean;

  /**
   * Allows the deletion of list items.
   * @default false
   */
  deleteEnabled?: boolean;

  /**
   * Makes the list scrollable.
   * @default false
   */
  scrollEnabled?: boolean;

  /**
   * Enables SwiftUI edit mode.
   * @default false
   */
  editModeEnabled?: boolean;
}

/**
 * DeleteItemEvent represents an event triggered when an item is deleted from the list.
 */
type DeleteItemEvent = Partial<ViewEvent<'onDeleteItem', { index: number }>>;
/**
 * MoveItemEvent represents an event triggered when an item is moved in the list.
 */
type MoveItemEvent = Partial<ViewEvent<'onMoveItem', { from: number; to: number }>>;
/**
 * SelectItemEvent represents an event triggered when the selection changes in a list.
 */
type SelectItemEvent = Partial<ViewEvent<'onSelectionChange', { selection: number[] }>>;

export type NativeListProps = ListProps &
  DeleteItemEvent &
  MoveItemEvent &
  SelectItemEvent & {
    children: React.ReactNode;
  };

export type DataListProps<T> = Omit<NativeListProps, 'children'> & {
  /**
   * Data for the list.
   * @property {T[]} data - An array of items to be rendered in the list.
   */
  data: T[];

  /**
   * Component that renders an item in the list.
   * @param {T} item - The item to render.
   * @param {number} index - The index of the item in the list.
   */
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
};

const ListNativeView = requireNativeView<NativeListProps>('ExpoUI', 'ListView');

/**
 * A generic list component that renders items from the given data using a provided render function.
 * @param {DataListProps<T>} props - The properties for the list component.
 * @returns {JSX.Element} The rendered list of items.
 */
export function DataList<T>(props: DataListProps<T>) {
  const { data, renderItem, ...nativeProps } = props;

  return (
    <ListNativeView {...nativeProps} style={[props.style, { flex: 1 }]}>
      {data.map((item, index) => (
        <View key={index}>{renderItem({ item, index })}</View>
      ))}
    </ListNativeView>
  );
}

/**
 * A list component that renders its children.
 * @param {NativeListProps} props - The properties for the list component.
 * @returns {JSX.Element} The rendered list with its children.
 */
export function List(props: NativeListProps) {
  const { children, ...nativeProps } = props;

  return (
    <ListNativeView {...nativeProps} style={[props.style, { flex: 1 }]}>
      {children}
    </ListNativeView>
  );
}
