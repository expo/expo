import { Ref } from 'react';
import { ExpoModifier } from '../../types';
export type SearchBarRef = {
    setText: (newText: string) => Promise<void>;
};
export type SearchBarProps = {
    /**
     * Can be used for imperatively setting text on the SearchBar component.
     */
    ref?: Ref<SearchBarRef>;
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
/**
 * Placeholder component for SearchBar.
 * This component marks its children to be rendered in the placeholder slot.
 */
export declare function Placeholder(props: PlaceholderProps): import("react").JSX.Element;
export declare namespace Placeholder {
    var tag: string;
}
/**
 * Renders a `SearchBar` component.
 */
declare function SearchBar(props: SearchBarProps): import("react").JSX.Element;
declare namespace SearchBar {
    var Placeholder: typeof import(".").Placeholder;
}
export { SearchBar };
//# sourceMappingURL=index.d.ts.map