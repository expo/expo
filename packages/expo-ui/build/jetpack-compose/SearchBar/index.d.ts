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
};
export type NativeSearchBarProps = SearchBarProps & {};
/**
 * Renders a `SearchBar` component.
 */
export declare function SearchBar(props: SearchBarProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map