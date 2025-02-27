import { requireNativeView } from 'expo';
import { StyleProp, View, ViewStyle } from 'react-native';
import { ViewEvent } from '../../src';

export type ListStyle = 'automatic' | 'plain' | 'inset' | 'insetGrouped' | 'grouped' | 'sidebar';

export interface ListProps {
  style?: StyleProp<ViewStyle>;
  listStyle?: ListStyle;
  selectEnabled?: boolean;
  moveEnabled?: boolean;
  deleteEnabled?: boolean;
  scrollEnabled?: boolean;
  editModeEnabled?: boolean;
}

type DeleteItemEvent = Partial<ViewEvent<'onDeleteItem', { index: number }>>;
type MoveItemEvent = Partial<ViewEvent<'onMoveItem', { from: number; to: number }>>;
type SelectItemEvent = Partial<ViewEvent<'onSelectionChange', { selection: number[] }>>;

export type NativeListProps = ListProps &
  DeleteItemEvent &
  MoveItemEvent &
  SelectItemEvent & {
    children: React.ReactNode;
  };

export type DataListProps<T> = Omit<NativeListProps, 'children'> & {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
};

const ListNativeView = requireNativeView<NativeListProps>('ExpoUI', 'ListView');

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

export function List(props: NativeListProps) {
  const { children, ...nativeProps } = props;

  return (
    <ListNativeView {...nativeProps} style={[props.style, { flex: 1 }]}>
      {children}
    </ListNativeView>
  );
}
