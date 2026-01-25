import { type CommonViewModifierProps } from '../types';
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
export declare function ListForEach({ children, onDelete, onMove, ...props }: ListForEachProps): import("react").JSX.Element;
//# sourceMappingURL=ListForEach.d.ts.map