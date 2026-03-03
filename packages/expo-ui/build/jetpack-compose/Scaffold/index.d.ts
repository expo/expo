import React from 'react';
import { ExpoModifier } from '../../types';
export type ScaffoldProps = {
    /**
     * Top bar content (e.g., `<AppBarWithSearch>`).
     */
    topBar?: React.ReactElement;
    /**
     * Bottom bar content (e.g., a navigation bar).
     */
    bottomBar?: React.ReactElement;
    /**
     * Floating action button content.
     */
    floatingActionButton?: React.ReactElement;
    /**
     * Main content rendered inside the scaffold.
     */
    children?: React.ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * Renders a Material 3 `Scaffold` layout with named slots for top bar, bottom bar,
 * floating action button, and main content.
 */
export declare function Scaffold({ topBar, bottomBar, floatingActionButton, children, modifiers, }: ScaffoldProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map