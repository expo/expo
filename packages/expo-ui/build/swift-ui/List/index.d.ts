import { type CommonViewModifierProps } from '../types';
export type ListStyle = 'automatic' | 'plain' | 'inset' | 'insetGrouped' | 'grouped' | 'sidebar';
export interface ListProps extends CommonViewModifierProps {
    /**
     * One of the predefined ListStyle types in SwiftUI.
     * @default 'automatic'
     */
    listStyle?: ListStyle;
    /**
     * Allows the selection of list items.
     * @default false
     */
    selectEnabled?: boolean;
    /**
     * Enables reordering of list items.
     * @default false
     */
    moveEnabled?: boolean;
    /**
     * Allows the deletion of list items.
     * @default false
     */
    deleteEnabled?: boolean;
    /**
     * Makes the list scrollable.
     * @default true
     * @platform ios 16.0+
     */
    scrollEnabled?: boolean;
    /**
     * Enables SwiftUI edit mode.
     * @default false
     */
    editModeEnabled?: boolean;
    /**
     * The children elements to be rendered inside the list.
     */
    children: React.ReactNode;
    /**
     * Callback triggered when an item is deleted from the list.
     */
    onDeleteItem?: (index: number) => void;
    /**
     * Callback triggered when an item is moved in the list.
     */
    onMoveItem?: (from: number, to: number) => void;
    /**
     * Callback triggered when the selection changes in a list.
     */
    onSelectionChange?: (selection: number[]) => void;
}
/**
 * A list component that renders its children using a native SwiftUI list.
 * @param {ListProps} props - The properties for the list component.
 * @returns {JSX.Element | null} The rendered list with its children or null if the platform is unsupported.
 * @platform ios
 */
export declare function List(props: ListProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map