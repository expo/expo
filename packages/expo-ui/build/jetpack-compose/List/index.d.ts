import React from 'react';
import { ExpoModifier } from '../../types';
export type ListProps = {
    /**
     * The children of the `List` component.
     */
    children: React.ReactNode;
    /**
     * Horizontal content padding in dp.
     * @default 16
     */
    contentPaddingHorizontal?: number;
    /**
     * Vertical content padding in dp.
     * @default 8
     */
    contentPaddingVertical?: number;
    /**
     * Spacing between items in dp.
     * @default 12
     */
    itemSpacing?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export declare function List(props: ListProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map