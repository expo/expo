import { type ExpoModifier } from '../../types';
export type SearchBarProps = {
    /**
     * Callback function that is called when the search text is submitted.
     */
    onSearch?: (searchText: string) => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    /**
     * The children of the component.
     */
    children?: React.ReactNode;
};
type PlaceholderProps = {
    /**
     * The children of the component.
     */
    children: React.ReactNode;
};
type ExpandedFullScreenSearchBarProps = {
    /**
     * The children of the component.
     */
    children: React.ReactNode;
};
/**
 * Placeholder component for SearchBar.
 * This component marks its children to be rendered in the placeholder slot.
 */
export declare function Placeholder(props: PlaceholderProps): import("react").JSX.Element;
export declare namespace Placeholder {
    var tag: string;
}
/**
 * ExpandedFullScreenSearchBar component for SearchBar.
 * This component marks its children to be rendered in the expanded full-screen search bar.
 */
export declare function ExpandedFullScreenSearchBar(props: ExpandedFullScreenSearchBarProps): import("react").JSX.Element;
export declare namespace ExpandedFullScreenSearchBar {
    var tag: string;
}
/**
 * Renders a `SearchBar` component.
 */
declare function SearchBar(props: SearchBarProps): import("react").JSX.Element;
declare namespace SearchBar {
    var Placeholder: typeof import(".").Placeholder;
    var ExpandedFullScreenSearchBar: typeof import(".").ExpandedFullScreenSearchBar;
}
export { SearchBar };
//# sourceMappingURL=index.d.ts.map