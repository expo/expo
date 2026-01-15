import { type CommonViewModifierProps } from '../types';
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
 * A list component that renders its children using a native SwiftUI list.
 */
export declare function List(props: ListProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map