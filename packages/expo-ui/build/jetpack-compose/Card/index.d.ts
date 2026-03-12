import { type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
/**
 * Colors for card's core elements.
 */
export type CardElementColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
};
export type CardProps = {
    /**
     * The content to display inside the card.
     */
    children?: React.ReactNode;
    /**
     * The variant of the card.
     * - 'default' - A filled card with no outline.
     * - 'elevated' - A filled card with elevation/shadow.
     * - 'outlined' - A card with an outline border.
     * @default 'default'
     */
    variant?: 'default' | 'elevated' | 'outlined';
    /**
     * The background color of the card.
     */
    color?: ColorValue;
    /**
     * Colors for card's core elements.
     */
    elementColors?: CardElementColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A card component that provides a surface for content.
 */
export declare function Card(props: CardProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map