import { type Ref } from 'react';
import { View, type ViewProps } from 'react-native';
export type GlassStyle = 'clear' | 'regular' | 'none';
export type GlassEffectStyleConfig = {
    /**
     * The glass effect style to apply.
     */
    style: GlassStyle;
    /**
     * Whether to animate the style change.
     * @default false
     */
    animate?: boolean;
    /**
     * Duration of the animation in seconds. Uses system default if not specified.
     */
    animationDuration?: number;
};
export type GlassColorScheme = 'auto' | 'light' | 'dark';
export type GlassViewProps = {
    /**
     * Glass effect style to apply to the view.
     * Can be a simple string ('clear', 'regular', 'none') or a config object
     * for controlling animation behavior.
     * @default 'regular'
     */
    glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
    /**
     * Tint color to apply to the glass effect.
     */
    tintColor?: string;
    /**
     * Whether the glass effect should be interactive.
     * @default false
     */
    isInteractive?: boolean;
    /**
     * The color scheme for the glass effect appearance.
     * Use this to override the system appearance when your app has its own theme toggle.
     * @default 'auto'
     */
    colorScheme?: GlassColorScheme;
    ref?: Ref<View>;
} & ViewProps;
//# sourceMappingURL=GlassView.types.d.ts.map