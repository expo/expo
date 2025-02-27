import { StyleProp, ViewStyle } from 'react-native';
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
type DeleteItemEvent = Partial<ViewEvent<'onDeleteItem', {
    index: number;
}>>;
type MoveItemEvent = Partial<ViewEvent<'onMoveItem', {
    from: number;
    to: number;
}>>;
type SelectItemEvent = Partial<ViewEvent<'onSelectionChange', {
    selection: number[];
}>>;
export type NativeListProps = ListProps & DeleteItemEvent & MoveItemEvent & SelectItemEvent & {
    children: React.ReactNode;
};
export type DataListProps<T> = Omit<NativeListProps, 'children'> & {
    data: T[];
    renderItem: ({ item, index }: {
        item: T;
        index: number;
    }) => React.ReactNode;
};
export declare function DataList<T>(props: DataListProps<T>): import("react").JSX.Element;
export declare function List(props: NativeListProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map