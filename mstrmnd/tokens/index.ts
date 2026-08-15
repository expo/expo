/**
 * Shared Linear aesthetic tokens.
 * One source of truth for CSS custom properties, Tailwind/NativeWind
 * presets, React Navigation, and React Native StyleSheet.
 */

export const color = {
  /** True black substrate */
  substrate: '#000000',
  /** Deep obsidian substrate */
  substrateObsidian: '#030303',
  /** Primary card fill */
  surface: '#0B0B0C',
  /** Elevated elements */
  surfaceElevated: '#121214',
  /** Muted line */
  borderMuted: '#1F1F23',
  /** Highlighted line */
  borderHighlight: '#2E2E33',
  /** Crisp off-white */
  textPrimary: '#F5F5F7',
  /** Muted gray */
  textSecondary: '#8A8A93',
  /** Linear-inspired blur-indigo */
  accent: '#5E6AD2',
  hairline: 'rgba(255, 255, 255, 0.08)',
  glassTint: 'rgba(255, 255, 255, 0.03)',
  glassTintSoft: 'rgba(255, 255, 255, 0.01)',
  /** Android glass fallback — high-opacity dark surface */
  glassFallback: 'rgba(18, 18, 20, 0.85)',
  /** Top ambient color leak */
  accentGlow: 'rgba(94, 106, 210, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmerStart: '#FFFFFF',
  shimmerEnd: '#A3A3A3',
} as const;

export const blur = {
  intensity: 25,
  radius: 20,
  tint: 'dark' as const,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40,
} as const;

export const radius = {
  card: 12,
  pad: 10,
  window: 14,
  pill: 999,
} as const;

export const font = {
  display: 'Syne_800ExtraBold',
  displayBold: 'Syne_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const tokens = {
  color,
  blur,
  space,
  radius,
  font,
} as const;

export type ColorToken = keyof typeof color;
export type Tokens = typeof tokens;

/** React Navigation dark theme mapped onto Linear tokens */
export const linearNavigationTheme = {
  dark: true,
  colors: {
    primary: color.accent,
    background: color.substrate,
    card: color.surface,
    text: color.textPrimary,
    border: color.borderMuted,
    notification: color.accent,
  },
  fonts: {
    regular: { fontFamily: font.sans, fontWeight: '400' as const },
    medium: { fontFamily: font.sansMedium, fontWeight: '500' as const },
    bold: { fontFamily: font.sansBold, fontWeight: '700' as const },
    heavy: { fontFamily: font.display, fontWeight: '800' as const },
  },
};

/** Tailwind / NativeWind `theme.extend` fragment */
export const tailwindThemeExtend = {
  colors: {
    substrate: color.substrate,
    obsidian: color.substrateObsidian,
    surface: color.surface,
    elevated: color.surfaceElevated,
    'border-muted': color.borderMuted,
    'border-highlight': color.borderHighlight,
    'text-primary': color.textPrimary,
    'text-secondary': color.textSecondary,
    accent: color.accent,
    hairline: color.hairline,
  },
  borderRadius: {
    card: `${radius.card}px`,
    window: `${radius.window}px`,
  },
} as const;
