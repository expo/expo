/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Color } from 'expo-router';
import { Platform } from 'react-native';

import '@/global.css';

export const Colors = Platform.select({
  ios: () => ({
    text: Color.ios.label,
    textSecondary: Color.ios.secondaryLabel,
    background: Color.ios.systemGroupedBackground,
    backgroundElement: Color.ios.secondarySystemGroupedBackground,
    backgroundSelected: Color.ios.tertiarySystemGroupedBackground,
  }),
  android: () => ({
    text: Color.android.dynamic.onSurface,
    textSecondary: Color.android.dynamic.onSurfaceVariant,
    background: Color.android.dynamic.surface,
    backgroundElement: Color.android.dynamic.surfaceContainer,
    backgroundSelected: Color.android.dynamic.surfaceContainerHigh,
  }),
  default: () => ({
    text: 'var(--color-text)',
    background: 'var(--color-background)',
    backgroundElement: 'var(--color-background-element)',
    backgroundSelected: 'var(--color-background-selected)',
    textSecondary: 'var(--color-text-secondary)',
  }),
})();

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
