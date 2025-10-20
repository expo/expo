import React from 'react';
import { type CommonViewModifierProps } from '../types';
export type GridProps = {
    /**
     * The guide for aligning the child views within the space allocated for a given cell. The default is center.
     */
    alignment?: 'center' | 'leading' | 'trailing' | 'top' | 'bottom' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing' | 'centerFirstTextBaseline' | 'centerLastTextBaseline' | 'leadingFirstTextBaseline' | 'leadingLastTextBaseline' | 'trailingFirstTextBaseline' | 'trailingLastTextBaseline';
    /**
     * The vertical distance between each cell, given in points. The value is nil by default, which results in a default distance between cells that’s appropriate for the platform.
     */
    verticalSpacing?: number;
    /**
     * The horizontal distance between each cell, given in points. The value is nil by default, which results in a default distance between cells that’s appropriate for the platform.
     */
    horizontalSpacing?: number;
    children: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Grid component uses the native [Grid](https://developer.apple.com/documentation/swiftui/grid) component.
 */
export declare function Grid(props: GridProps): React.JSX.Element;
export declare namespace Grid {
    var Row: React.FC<{
        children: React.ReactNode;
    }>;
}
//# sourceMappingURL=index.d.ts.map