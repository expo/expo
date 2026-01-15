import { type CommonViewModifierProps } from '../types';
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
export declare function ForEach({ children, onDelete, onMove, ...props }: ForEachProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map