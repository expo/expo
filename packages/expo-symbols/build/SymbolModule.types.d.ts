import type { ColorValue, ProcessedColorValue, ViewProps } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export type SymbolViewProps = {
    /**
     * The name of the symbol. Symbols can be viewed in the [Apple SF Symbols app](https://developer.apple.com/sf-symbols/).
     */
    name: SFSymbol;
    /**
     * Fallback to render on Android and Web where `SF Symbols` are not available.
     */
    fallback?: React.ReactNode;
    /**
     * Determines the symbol variant to use.
     * @default 'monochrome'
     */
    type?: SymbolType;
    /**
     * The scale of the symbol to render.
     * @default 'unspecified'
     */
    scale?: SymbolScale;
    /**
     * The weight of the symbol to render.
     * @default 'unspecified'
     */
    weight?: SymbolWeight;
    /**
     * An array of colors to use when the {@link SymbolType} is `palette`.
     */
    colors?: ColorValue | ColorValue[];
    /**
     * The size of the symbol.
     * @default 24
     */
    size?: number;
    /**
     * The tint color to apply to the symbol.
     */
    tintColor?: ColorValue;
    /**
     * Determines how the image should be resized to fit its container.
     * @default 'scaleAspectFit'
     */
    resizeMode?: ContentMode;
    /**
     * The animation configuration to apply to the symbol.
     */
    animationSpec?: AnimationSpec;
} & ViewProps;
/**
 * It narrows down some props to types expected by the native/web side.
 * @hidden
 */
export interface NativeSymbolViewProps extends ViewProps {
    name: string;
    type: SymbolType;
    scale?: SymbolScale;
    weight?: SymbolWeight;
    animated: boolean;
    colors: (ProcessedColorValue | null | undefined)[];
    tint: ProcessedColorValue | null | undefined;
    resizeMode?: ContentMode;
    animationSpec?: AnimationSpec;
}
/**
 * The weight of the symbol to render.
 */
export type SymbolWeight = 'unspecified' | 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
/**
 * The scale of the symbol to render.
 */
export type SymbolScale = 'default' | 'unspecified' | 'small' | 'medium' | 'large';
/**
 * Determines how the image should be resized to fit its container.
 */
export type ContentMode = 'scaleToFill' | 'scaleAspectFit' | 'scaleAspectFill' | 'redraw' | 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
/**
 * The animation configuration to apply to the symbol.
 */
export type AnimationSpec = {
    /**
     * The effect to apply to the symbol.
     */
    effect?: AnimationEffect;
    /**
     * If the animation should repeat.
     */
    repeating?: boolean;
    /**
     * The number of times the animation should repeat.
     */
    repeatCount?: number;
    /**
     * The duration of the animation in seconds.
     */
    speed?: number;
    /**
     * An object that specifies how the symbol’s layers should animate.
     */
    variableAnimationSpec?: VariableAnimationSpec;
};
export type AnimationEffect = {
    /**
     * The type of animation to apply to the symbol.
     */
    type: AnimationType;
    /**
     * Whether the entire symbol should animate or just the individual layers.
     * @default false
     */
    wholeSymbol?: boolean;
    /**
     * The direction of the animation.
     */
    direction?: 'up' | 'down';
};
/**
 * The type of animation to apply to the symbol.
 */
export type AnimationType = 'bounce' | 'pulse' | 'scale';
/**
 * A variable color animation draws attention to a symbol by changing the opacity of the symbol’s layers.
 * You can choose to apply the effect to layers either cumulatively or iteratively.
 * For cumulative animations, each layer’s opacity remains changed until the end of the animation cycle.
 * For iterative animations, each layer’s opacity changes briefly before returning to its original state.
 * These effects are compounding, each value set to `true` will add an additional effect.
 */
export type VariableAnimationSpec = {
    /**
     * An effect that reverses each time it repeats.
     */
    reversing?: boolean;
    /**
     * An effect that doesn’t reverse each time it repeats.
     */
    nonReversing?: boolean;
    /**
     * This effect enables each successive variable layer, and the layer remains enabled until the end of the animation cycle. This effect cancels the iterative variant.
     */
    cumulative?: boolean;
    /**
     * An effect that momentarily enables each layer of a symbol in sequence.
     */
    iterative?: boolean;
    /**
     * An effect that hides inactive layers of a symbol.
     * This effect hides inactive layers completely, rather than drawing them with reduced, but nonzero, opacity.
     */
    hideInactiveLayers?: boolean;
    /**
     * An effect that dims inactive layers of a symbol.
     * This effect draws inactive layers with reduced, but nonzero, opacity.
     */
    dimInactiveLayers?: boolean;
};
/**
 * Determines the symbol variant to use.
 *
 * - `'monochrome'` - Creates a color configuration that specifies that the symbol image uses its monochrome variant.
 *
 * - `'hierarchical'` - Creates a color configuration with a color scheme that originates from one color.
 *
 * - `'palette'` - Creates a color configuration with a color scheme from a palette of multiple colors.
 *
 * - `'multicolor'` - Creates a color configuration that specifies that the symbol image uses its multicolor variant, if one exists.
 */
export type SymbolType = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';
//# sourceMappingURL=SymbolModule.types.d.ts.map