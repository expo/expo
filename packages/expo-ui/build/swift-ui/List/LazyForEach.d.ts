import { type LazyDescriptor } from '../lazy';
import { type CommonViewModifierProps } from '../types';
export type LazyForEachProps = {
    /**
     * The row descriptors to render. Build them with the factories from
     * `@expo/ui/swift-ui/lazy` (e.g. `Lazy.HStack`, `Lazy.Text`).
     *
     * Each top-level descriptor becomes one cell in the parent `List`. SwiftUI
     * lazy-instantiates cells, so passing thousands of entries is cheap.
     */
    items: LazyDescriptor[];
} & CommonViewModifierProps;
/**
 * A lazy variant of `List.ForEach` that takes a serializable row-descriptor array
 * instead of React children. Use it when row count is large and rows fit the
 * closed lazy DSL (`Text`, `Image`, `HStack`, `VStack`).
 */
export declare function LazyForEach({ items, ...props }: LazyForEachProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LazyForEach.d.ts.map