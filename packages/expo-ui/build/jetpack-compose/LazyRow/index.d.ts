import type { ExpoModifier } from '../../types';
import { type ContentPadding } from '../LazyColumn';
export type LazyRowProps = {
    /**
     * The content to display inside the lazy row.
     */
    children?: React.ReactNode;
    /**
     * The horizontal arrangement of items.
     * Can be a preset string or an object with `spacedBy` to specify spacing in dp.
     */
    horizontalArrangement?: 'start' | 'end' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | {
        spacedBy: number;
    };
    /**
     * The vertical alignment of items.
     */
    verticalAlignment?: 'top' | 'bottom' | 'center';
    /**
     * Content padding in dp.
     */
    contentPadding?: ContentPadding;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A lazy row component that efficiently displays a horizontally scrolling list.
 */
export declare function LazyRow(props: LazyRowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map