import { requireNativeView } from 'expo';
import { type ReactElement } from 'react';

import { useItemKeys } from '../../recycling/useRecycledRows';
import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';
import { DataListForEach, NativeSlot, type ListForEachProps } from './DataListForEach';

export { type ListForEachProps };

const ListForEachNativeView: React.ComponentType<NativeListForEachProps> =
  requireNativeView<NativeListForEachProps>('ExpoUI', 'ListForEachView');

type DeleteEvent = ViewEvent<'onDelete', { indices: number[] }>;

type MoveEvent = ViewEvent<'onMove', { sourceIndices: number[]; destination: number }>;

type NativeListForEachProps = CommonViewModifierProps &
  DeleteEvent &
  MoveEvent & {
    children: React.ReactNode;
    deleteEnabled: boolean;
    moveEnabled: boolean;
  };

/**
 * @deprecated Pass `data` and `keyExtractor`, and render each row from a `children` function.
 */
export interface ListForEachElementsProps extends CommonViewModifierProps {
  data?: never;
  keyExtractor?: never;
  recycling?: never;
  overscanCount?: never;
  estimatedItemSize?: never;
  /**
   * The children elements to be rendered inside the `List.ForEach`.
   */
  children: React.ReactNode;
  /**
   * Callback triggered when items are deleted.
   * Receives an array of indices that were deleted.
   * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/dynamicviewcontent/ondelete(perform:)).
   */
  onDelete?: (indices: number[]) => void;
  /**
   * Callback triggered when items are moved.
   * Receives the source indices and destination index.
   * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/dynamicviewcontent/onmove(perform:)).
   */
  onMove?: (sourceIndices: number[], destination: number) => void;
}

let warnedElements = false;

/**
 * A group of rows inside `List`, with optional deletion and reordering.
 * Pass `data` with `keyExtractor`, and render each row from a `children` function.
 * Recycles rows unless `recycling` is `false`.
 */
export function ListForEach<T>(props: ListForEachProps<T>): ReactElement;
/**
 * @hidden
 * @deprecated Pass `data` and `keyExtractor`, and render each row from a `children` function.
 */
export function ListForEach(props: ListForEachElementsProps): ReactElement;
export function ListForEach<T>(props: ListForEachProps<T> | ListForEachElementsProps) {
  if (props.data === undefined) {
    if (__DEV__ && !warnedElements) {
      warnedElements = true;
      console.warn(
        '[@expo/ui] Passing elements as List.ForEach children is deprecated. Pass `data` and `keyExtractor`, and render each row from a `children` function: `{({ item }) => <Row item={item} />}`.'
      );
    }
    return <ChildrenListForEach {...props} />;
  }
  const { recycling = true, ...rest } = props;
  return recycling ? <DataListForEach {...rest} /> : <StaticListForEach {...rest} />;
}

function ChildrenListForEach({ children, onDelete, onMove, ...props }: ListForEachElementsProps) {
  return (
    <ListForEachNativeView
      {...props}
      deleteEnabled={!!onDelete}
      moveEnabled={!!onMove}
      onDelete={onDelete ? ({ nativeEvent }) => onDelete(nativeEvent.indices) : undefined}
      onMove={
        onMove
          ? ({ nativeEvent }) => onMove(nativeEvent.sourceIndices, nativeEvent.destination)
          : undefined
      }>
      {children}
    </ListForEachNativeView>
  );
}

function StaticListForEach<T>({
  data,
  keyExtractor,
  children: renderItem,
  overscanCount: _overscanCount,
  estimatedItemSize: _estimatedItemSize,
  ...props
}: Omit<ListForEachProps<T>, 'recycling'>) {
  const itemKeys = useItemKeys('List.ForEach', data, keyExtractor);
  return (
    <ChildrenListForEach {...props}>
      {data.map((item, index) => (
        <NativeSlot key={itemKeys[index]} itemKey={itemKeys[index]!} index={index} revision={0}>
          {renderItem({ item, index })}
        </NativeSlot>
      ))}
    </ChildrenListForEach>
  );
}
