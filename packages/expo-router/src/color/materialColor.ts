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

export function Material3DynamicColor(name: string): string | null {
  return null;
}

export function Material3Color(name: string): string | null {
  return null;
}
