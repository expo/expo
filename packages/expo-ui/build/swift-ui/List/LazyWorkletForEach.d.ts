import { type ObservableState } from '../../State/useNativeState';
import { type LazyDescriptor } from '../lazy';
import { type CommonViewModifierProps } from '../types';
export type LazyWorkletForEachProps<T> = {
    /**
     * Observable list of items. Mutations to `data.value` re-trigger SwiftUI's body and
     * the underlying `ForEach` diffs by id — add/remove/update/reorder animate correctly.
     * Create with `useNativeState<Item[]>(initial)`.
     */
    data: ObservableState<T[]>;
    /**
     * The property name on each item used as a stable identity. Defaults to `"id"`.
     * Must resolve to a value that is `String | Number | Boolean` for SwiftUI diffing.
     */
    idKey?: keyof T & string;
    /**
     * Worklet that returns the descriptor for a row. Called by SwiftUI on the UI runtime
     * *at cell-instantiation time* — only for visible cells. Must be marked with the
     * `'worklet'` directive.
     */
    renderItem: (item: T, index: number) => LazyDescriptor;
    /**
     * When `true` (default), insert / remove / reorder are wrapped in SwiftUI's default
     * animation. Set to `false` to disable for cases where you want jank-free bulk updates.
     */
    animated?: boolean;
} & CommonViewModifierProps;
/**
 * Worklet-driven lazy list backed by observable data.
 *
 * - `data` is an `ObservableState<Item[]>`; mutate `data.value` to drive updates.
 * - `renderItem` is a worklet returning a `LazyDescriptor`, run only for visible cells.
 * - Identity is taken from `data.value[i][idKey]`.
 */
export declare function LazyWorkletForEach<T>({ data, idKey, renderItem, animated, ...props }: LazyWorkletForEachProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LazyWorkletForEach.d.ts.map