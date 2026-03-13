import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';

const ListForEachNativeView: React.ComponentType<NativeListForEachProps> =
  requireNativeView<NativeListForEachProps>('ExpoUI', 'ListForEachView');

type DeleteEvent = ViewEvent<'onDelete', { indices: number[] }>;

type MoveEvent = ViewEvent<'onMove', { sourceIndices: number[]; destination: number }>;

type NativeListForEachProps = CommonViewModifierProps &
  DeleteEvent &
  MoveEvent & {
    children: React.ReactNode;
  };

export type ListForEachProps = {
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
} & CommonViewModifierProps;

/**
 * A compound component of `List` that enables item deletion and reordering.
 * This component must be used as a child of `List` (as `List.ForEach`).
 */
export function ListForEach({ children, onDelete, onMove, ...props }: ListForEachProps) {
  return (
    <ListForEachNativeView
      {...props}
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
