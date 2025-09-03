import { ViewProps } from 'react-native';
export type GlassStyle = 'clear' | 'regular';
export type GlassViewProps = {
    /**
     * Glass effect style to apply to the view.
     * @default 'regular'
     * @platform ios
     */
    glassEffectStyle?: GlassStyle;
    /**
     * Tint color to apply to the glass effect.
     * @platform ios
     */
    tintColor?: string;
    /**
     * Whether the glass effect should be interactive.
     * @default false
     * @platform ios
     */
    isInteractive?: boolean;
} & ViewProps;
//# sourceMappingURL=GlassView.types.d.ts.map