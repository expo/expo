import { palette } from '@expo/styleguide-base';
import type { LogSeverity } from 'expo-app-metrics';
import { useColorScheme } from 'react-native';

import type { useTheme } from '@/utils/theme';

type Theme = ReturnType<typeof useTheme>;

export type SeverityColors = {
  background: string;
  text: string;
  border: string;
};

/**
 * Resolves the active palette branch (light/dark) once per render. Pass the
 * result into `severityColors` so it can be called inside loops without
 * violating the rules of hooks.
 */
export function usePaletteScheme() {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export function severityColors(
  severity: LogSeverity,
  theme: Theme,
  paletteScheme: ReturnType<typeof usePaletteScheme>
): SeverityColors {
  switch (severity) {
    case 'fatal':
      // Deeper, more saturated red than `error` (which uses the soft `red3` background).
      // Stays in the same red family rather than flipping to an inverted fill.
      return {
        background: paletteScheme.red6,
        text: paletteScheme.red11,
        border: paletteScheme.red9,
      };
    case 'error':
      return {
        background: theme.background.danger,
        text: theme.text.danger,
        border: theme.border.danger,
      };
    case 'warn':
      return {
        background: theme.background.warning,
        text: theme.text.warning,
        border: theme.border.warning,
      };
    case 'info':
      return {
        background: theme.background.info,
        text: theme.text.info,
        border: theme.border.info,
      };
    case 'trace':
      // Faint purple — distinct from `debug` while staying low-key. Purple
      // reads as "verbose / tracing" in many OTel UIs.
      return {
        background: paletteScheme.purple2,
        text: paletteScheme.purple10,
        border: paletteScheme.purple5,
      };
    case 'debug':
    default:
      return {
        background: theme.background.subtle,
        text: theme.text.secondary,
        border: theme.border.secondary,
      };
  }
}
