import { Appearance } from 'react-native';

import ExpoSystemUI from './ExpoSystemUI';

export type DynamicColorName =
  | 'Primary'
  | 'OnPrimary'
  | 'PrimaryContainer'
  | 'OnPrimaryContainer'
  | 'PrimaryInverse'
  | 'PrimaryFixed'
  | 'PrimaryFixedDim'
  | 'OnPrimaryFixed'
  | 'OnPrimaryFixedVariant'
  | 'Secondary'
  | 'OnSecondary'
  | 'SecondaryContainer'
  | 'OnSecondaryContainer'
  | 'SecondaryFixed'
  | 'SecondaryFixedDim'
  | 'OnSecondaryFixed'
  | 'OnSecondaryFixedVariant'
  | 'Tertiary'
  | 'OnTertiary'
  | 'TertiaryContainer'
  | 'OnTertiaryContainer'
  | 'TertiaryFixed'
  | 'TertiaryFixedDim'
  | 'OnTertiaryFixed'
  | 'OnTertiaryFixedVariant'
  | 'Error'
  | 'OnError'
  | 'ErrorContainer'
  | 'OnErrorContainer'
  | 'Outline'
  | 'OutlineVariant'
  | 'OnBackground'
  | 'Surface'
  | 'OnSurface'
  | 'SurfaceVariant'
  | 'OnSurfaceVariant'
  | 'SurfaceInverse'
  | 'OnSurfaceInverse'
  | 'SurfaceBright'
  | 'SurfaceDim'
  | 'SurfaceContainer'
  | 'SurfaceContainerLow'
  | 'SurfaceContainerLowest'
  | 'SurfaceContainerHigh'
  | 'SurfaceContainerHighest';

function NativeDynamicColor(
  name: DynamicColorName,
  scheme: 'light' | 'dark' | 'unspecified'
): string | null {
  if (process.env.EXPO_OS === 'android') {
    return ExpoSystemUI.Material3DynamicColor(name, scheme);
  }
  return null;
}

export function Material3DynamicColor(name: DynamicColorName): string | null {
  const scheme = Appearance.getColorScheme();
  return NativeDynamicColor(name, scheme ?? 'unspecified');
}
