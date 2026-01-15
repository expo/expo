import { type CommonViewModifierProps } from '../types';
export interface ForEachProps<T> extends CommonViewModifierProps {
    /**
     * Render function that receives each item and its index.
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
 * A component that creates views from a collection of data, supporting delete, move, and selection operations.
 * Use this inside a `List` component to enable swipe-to-delete, drag-to-reorder, and multi-selection.
 */
export declare function ForEach<T>({ children, onDelete, onMove, ...props }: ForEachProps<T>): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map