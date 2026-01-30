import { type ExpoModifier } from '../../types';
export type DockedSearchBarProps = {
    /**
     * Callback function that is called when the search query changes.
     */
    onQueryChange?: (query: string) => void;
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
    children: React.ReactNode;
};
type LeadingIconProps = {
    children: React.ReactNode;
};
export declare function DockedSearchBarPlaceholder(props: PlaceholderProps): import("react").JSX.Element;
export declare namespace DockedSearchBarPlaceholder {
    var tag: string;
}
export declare function DockedSearchBarLeadingIcon(props: LeadingIconProps): import("react").JSX.Element;
export declare namespace DockedSearchBarLeadingIcon {
    var tag: string;
}
declare function DockedSearchBar(props: DockedSearchBarProps): import("react").JSX.Element;
declare namespace DockedSearchBar {
    var Placeholder: typeof DockedSearchBarPlaceholder;
    var LeadingIcon: typeof DockedSearchBarLeadingIcon;
}
export { DockedSearchBar };
//# sourceMappingURL=index.d.ts.map