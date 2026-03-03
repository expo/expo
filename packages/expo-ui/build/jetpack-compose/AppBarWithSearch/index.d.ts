import React, { Ref } from 'react';
import { ExpoModifier } from '../../types';
export type AppBarWithSearchRef = {
    setText: (newText: string) => Promise<void>;
    collapse: () => Promise<void>;
};
export type AppBarWithSearchProps = {
    /**
     * Can be used for imperatively setting text on the AppBarWithSearch search field.
     */
    ref?: Ref<AppBarWithSearchRef>;
    /**
     * The title text displayed in the app bar. Also used as the search bar placeholder if `placeholder` is not set.
     */
    title: string;
    /**
     * Placeholder text displayed in the search input field. Falls back to `title` if not set.
     */
    placeholder?: string;
    /**
     * Initial value that the search field displays when being mounted.
     */
    defaultValue?: string;
    /**
     * A callback triggered when the search query text changes.
     */
    onChangeText?: (value: string) => void;
    /**
     * A callback triggered when the user submits a search (presses enter/search on keyboard).
     */
    onSearchSubmitted?: (value: string) => void;
    /**
     * A callback triggered when the search bar expands or collapses.
     */
    onExpandedChange?: (expanded: boolean) => void;
    /**
     * Navigation icon element (e.g., an `<IconButton>` with a back arrow).
     */
    navigationIcon?: React.ReactElement;
    /**
     * Trailing action icon element (e.g., an `<IconButton>` with a menu icon).
     */
    trailingIcon?: React.ReactElement;
    /**
     * Search results content shown in the full-screen expanded search overlay.
     */
    children?: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * Renders a Material 3 `AppBarWithSearch` component with an inline search bar
 * and a built-in `ExpandedFullScreenSearchBar` for full-screen search results.
 */
export declare function AppBarWithSearch({ navigationIcon, trailingIcon, children, onChangeText, onSearchSubmitted, onExpandedChange, ...rest }: AppBarWithSearchProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map