import { type CommonViewModifierProps } from '../types';
export interface ForEachProps<T> extends CommonViewModifierProps {
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
}
/**
 * A component that renders its children using a native SwiftUI ForEach.
 */
export declare function ForEach<T>({ children, onDelete, onMove, ...props }: ForEachProps<T>): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map