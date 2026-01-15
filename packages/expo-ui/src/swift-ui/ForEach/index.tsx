import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';

const ForEachNativeView: React.ComponentType<NativeForEachProps> =
  requireNativeView<NativeForEachProps>('ExpoUI', 'ForEachView');

/**
 * Event triggered when items are deleted from the list.
 */
type DeleteEvent = ViewEvent<'onDelete', { indices: number[] }>;

/**
 * Event triggered when items are moved within the list.
 */
type MoveEvent = ViewEvent<'onMove', { sourceIndices: number[]; destination: number }>;

type NativeForEachProps = CommonViewModifierProps &
  DeleteEvent &
  MoveEvent & {
    children: React.ReactNode;
  };

export type ForEachProps = {
  /**
   * The children elements to be rendered inside the foreach.
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
 * A component that renders its children using a native SwiftUI `ForEach`.
 */
export function ForEach({ children, onDelete, onMove, ...props }: ForEachProps) {
  return (
    <ForEachNativeView
      {...props}
      onDelete={onDelete ? ({ nativeEvent }) => onDelete(nativeEvent.indices) : undefined}
      onMove={
        onMove
          ? ({ nativeEvent }) => onMove(nativeEvent.sourceIndices, nativeEvent.destination)
          : undefined
      }>
      {children}
    </ForEachNativeView>
  );
}
