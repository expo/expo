import { type CommonViewModifierProps } from '../types';
export interface ListProps extends CommonViewModifierProps {
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
     * Callback triggered when the selection changes in a list.
     */
    onSelectionChange?: (selection: number[]) => void;
}
/**
 * A list component that renders its children using a native SwiftUI list.
 * @param {ListProps} props - The properties for the list component.
 * @returns {JSX.Element | null} The rendered list with its children or null if the platform is unsupported.
 */
export declare function List(props: ListProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map