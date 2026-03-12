import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Colors for card's core elements.
 */
export type CardColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
};
export type CardProps = {
    /**
     * The content to display inside the card.
     */
    children?: React.ReactNode;
    /**
     * Colors for card's core elements.
     */
    colors?: CardColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A card component that provides a surface for content.
 */
export declare function Card(props: CardProps): import("react").JSX.Element;
/**
 * An elevated card component that provides a raised surface for content.
 */
export declare function ElevatedCard(props: CardProps): import("react").JSX.Element;
/**
 * An outlined card component that provides a bordered surface for content.
 */
export declare function OutlinedCard(props: CardProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map