import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Colors for card's core elements.
 */
export type CardColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
};
/**
 * Border configuration for cards.
 */
export type CardBorder = {
    /**
     * Border width in dp.
     * @default 1
     */
    width?: number;
    /**
     * Border color.
     */
    color?: ColorValue;
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
     * Default elevation in dp.
     */
    elevation?: number;
    /**
     * Border configuration for the card.
     */
    border?: CardBorder;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A card component that renders a filled card surface for content.
 */
export declare const Card: import("react").ComponentType<CardProps>;
export type ElevatedCardProps = {
    /**
     * The content to display inside the card.
     */
    children?: React.ReactNode;
    /**
     * Colors for card's core elements.
     */
    colors?: CardColors;
    /**
     * Default elevation in dp. Material 3 default is 1dp.
     */
    elevation?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * An elevated card component that provides a raised surface for content.
 */
export declare const ElevatedCard: import("react").ComponentType<ElevatedCardProps>;
export type OutlinedCardProps = {
    /**
     * The content to display inside the card.
     */
    children?: React.ReactNode;
    /**
     * Colors for card's core elements.
     */
    colors?: CardColors;
    /**
     * Default elevation in dp.
     */
    elevation?: number;
    /**
     * Border configuration for the outlined card.
     */
    border?: CardBorder;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * An outlined card component that provides a bordered surface for content.
 */
export declare const OutlinedCard: import("react").ComponentType<OutlinedCardProps>;
//# sourceMappingURL=index.d.ts.map