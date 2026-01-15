import { type Ref } from 'react';
import { View, type ViewProps } from 'react-native';

export type GlassStyle = 'clear' | 'regular';

export type GlassColorScheme = 'auto' | 'light' | 'dark';

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
  /**
   * The color scheme for the glass effect appearance.
   * Use this to override the system appearance when your app has its own theme toggle.
   * @default 'auto'
   */
  colorScheme?: GlassColorScheme;
  ref?: Ref<View>;
} & ViewProps;
