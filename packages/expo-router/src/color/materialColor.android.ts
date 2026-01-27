import { requireNativeModule } from 'expo-modules-core';
import { Appearance } from 'react-native';

export type AndroidMaterialColorName =
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'primaryInverse'
  | 'primaryFixed'
  | 'primaryFixedDim'
  | 'onPrimaryFixed'
  | 'onPrimaryFixedVariant'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'secondaryFixed'
  | 'secondaryFixedDim'
  | 'onSecondaryFixed'
  | 'onSecondaryFixedVariant'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant'
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'outline'
  | 'outlineVariant'
  | 'onBackground'
  | 'surface'
  | 'onSurface'
  | 'surfaceVariant'
  | 'onSurfaceVariant'
  | 'surfaceInverse'
  | 'onSurfaceInverse'
  | 'surfaceBright'
  | 'surfaceDim'
  | 'surfaceContainer'
  | 'surfaceContainerLow'
  | 'surfaceContainerLowest'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest';

type SchemeName = 'light' | 'dark' | 'unspecified';

interface AndroidExpoRouterModuleType {
  Material3DynamicColor(name: string, scheme: SchemeName): string | null;
  Material3Color(name: string, scheme: SchemeName): string | null;
}

let AndroidExpoRouterModule: AndroidExpoRouterModuleType | null = null;

function NativeDynamicColor(name: string, scheme: SchemeName): string | null {
  if (!AndroidExpoRouterModule) {
    AndroidExpoRouterModule = requireNativeModule<AndroidExpoRouterModuleType>('ExpoRouter');
  }
  return AndroidExpoRouterModule.Material3DynamicColor(name, scheme);
}

function NativeMaterialColor(name: string, scheme: SchemeName): string | null {
  if (!AndroidExpoRouterModule) {
    AndroidExpoRouterModule = requireNativeModule<AndroidExpoRouterModuleType>('ExpoRouter');
  }
  return AndroidExpoRouterModule.Material3Color(name, scheme);
}

export function Material3DynamicColor(name: string): string | null {
  const scheme = Appearance.getColorScheme();
  return NativeDynamicColor(name, scheme ?? 'unspecified');
}

export function Material3Color(name: string): string | null {
  const scheme = Appearance.getColorScheme();
  return NativeMaterialColor(name, scheme ?? 'unspecified');
}
