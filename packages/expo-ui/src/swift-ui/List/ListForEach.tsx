import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';
import { DataListForEach, type DataListForEachProps } from './DataListForEach';

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

export interface ListForEachProps extends CommonViewModifierProps {
  data?: never;
  keyExtractor?: never;
  renderItem?: never;
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

/**
 * A group of rows inside List, with optional deletion and reordering.
 * Pass `children`, or `data` with `keyExtractor` and `renderItem`.
 * The `data` and `renderItem` form recycles rows.
 */
export function ListForEach<ItemT>(props: ListForEachProps | DataListForEachProps<ItemT>) {
  if (props.data !== undefined) return <DataListForEach {...props} />;
  return <ChildrenListForEach {...props} />;
}

function ChildrenListForEach({ children, onDelete, onMove, ...props }: ListForEachProps) {
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
