import { ListForEach } from './ListForEach';
import { type CommonViewModifierProps } from '../types';
export { ListForEach, type ListForEachProps } from './ListForEach';
export { LazyForEach, type LazyForEachProps } from './LazyForEach';
export { LazyWorkletForEach, type LazyWorkletForEachProps } from './LazyWorkletForEach';
export interface ListProps extends CommonViewModifierProps {
    /**
     * The children elements to be rendered inside the list.
     */
    children: React.ReactNode;
    /**
     * The currently selected item tags.
     */
    selection?: (string | number)[];
    /**
     * Callback triggered when the selection changes in a list.
     * Returns an array of selected item tags.
     */
    onSelectionChange?: (selection: (string | number)[]) => void;
}
/**
 * A list component that renders its children using a native SwiftUI `List`.
 */
export declare function List(props: ListProps): import("react/jsx-runtime").JSX.Element;
export declare namespace List {
    var ForEach: typeof ListForEach;
    var LazyForEach: typeof import("./LazyForEach").LazyForEach;
    var LazyWorkletForEach: typeof import("./LazyWorkletForEach").LazyWorkletForEach;
}
//# sourceMappingURL=index.d.ts.map