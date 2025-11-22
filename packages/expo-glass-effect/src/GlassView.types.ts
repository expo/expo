import { ViewProps } from 'react-native';

export type GlassStyle = 'clear' | 'regular';

export type GlassViewProps = {
  /**
   * Glass effect style to apply to the view.
   * @default 'regular'
   */
  glassEffectStyle?: GlassStyle;
  /**
   * Tint color to apply to the glass effect.
   */
  tintColor?: string;
  /**
   * Whether the glass effect should be interactive.
   * @default false
   */
  isInteractive?: boolean;
} & ViewProps;
