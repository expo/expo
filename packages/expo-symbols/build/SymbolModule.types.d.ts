import { ViewProps } from 'react-native';
export interface SymbolViewProps extends ViewProps {
    /**
     * The name of the symbol. Can be found in the [Apple SF Symbols app](https://developer.apple.com/sf-symbols/).
     */
    name: string;
    /**
     * Fallback to render on Android where SF symbols are not available.
     */
    fallback?: React.ReactNode;
    /**
     * The type of symbol to render.
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
     * An array of colors to use when the [SymbolType](#symboltype) is 'palette'.
     */
    colors?: string | string[] | null;
    /**
     * The tint color to apply to the symbol.
     * @default null
     */
    tintColor?: string | null;
    /**
     * The content mode to apply to the symbol.
     * @default 'scaleToAspectFit'
     */
    resizeMode?: SymbolContentMode;
    /**
     * The animation configuration to apply to the symbol.
     */
    animationSpec?: AnimationSpec;
}
export interface NativeSymbolViewProps extends ViewProps {
    name: string;
    type: SymbolType;
    scale?: SymbolScale;
    weight?: SymbolWeight;
    animated: boolean;
    colors?: string | string[];
    tint?: string;
    resizeMode?: SymbolContentMode;
    animationSpec?: AnimationSpec;
}
type SymbolWeight = 'unspecified' | 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
type SymbolScale = 'default' | 'unspecified' | 'small' | 'medium' | 'large';
type SymbolContentMode = 'scaleToFill' | 'scaleAspectFit' | 'scaleAspectFill' | 'redraw' | 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
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
    variableAnimationSpec?: VariableAnimationSpec;
};
export type AnimationEffect = {
    /**
     * The type of animation to apply to the symbol.
     */
    type: AnimationType;
    /**
     * Whether the entire symbol should animate or just the individual layers.
     */
    wholeSymbol?: boolean;
    /**
     * The direction of the animation.
     */
    direction?: 'up' | 'down';
};
type AnimationType = 'bounce' | 'pulse' | 'scale';
type VariableAnimationSpec = {
    reversing?: boolean;
    cumulative?: boolean;
    iterative?: boolean;
    hideInactiveLayers?: boolean;
    dimInactiveLayers?: boolean;
};
type SymbolType = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';
export {};
//# sourceMappingURL=SymbolModule.types.d.ts.map