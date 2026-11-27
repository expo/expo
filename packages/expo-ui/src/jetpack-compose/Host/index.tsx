import { requireNativeView } from 'expo';
import { useMemo, type Ref } from 'react';
import {
  type ColorSchemeName,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
  I18nManager,
  processColor,
  useColorScheme as useRNColorScheme,
} from 'react-native';

import { NativeTreeContext, useWarnIfNestedHost } from '../../NativeTreeContext';
import { TextInputHostProvider, useTextInputHostRef } from '../../keyboard';
import { useMergeRefs } from '../../utils/useMergeRefs';
import {
  getMaterialColors,
  HostPaletteContext,
  type MaterialColors,
  type RgbaHex,
} from '../colors';
import { type PrimitiveBaseProps } from '../layout';

export interface HostProps extends PrimitiveBaseProps {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from Jetpack Compose.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };

  /**
   * Callback function that is triggered when the Jetpack Compose content completes its layout.
   * Provides the current dimensions of the content, which may change as the content updates.
   */
  onLayoutContent?: (event: { nativeEvent: { width: number; height: number } }) => void;

  /**
   * When true and no explicit size is provided, the host will use the viewport size as the proposed size for Compose layout.
   * This is particularly useful for views that need to fill their available space.
   * @default false
   */
  useViewportSizeMeasurement?: boolean;

  /**
   * The color scheme of the host view. `'light'` / `'dark'` force a specific
   * appearance; omitted follows the device setting. The palette itself
   * follows the device wallpaper on Android 12+ (Material You) or the static
   * Material 3 baseline otherwise — unless {@link seedColor} is set.
   */
  colorScheme?: ColorSchemeName;

  /**
   * Seed color used to generate a Material 3 palette (`SchemeTonalSpot`) for
   * this host. Combines with `colorScheme` (`'light'` / `'dark'` or omitted)
   * to produce a seeded palette that themes Compose children and is
   * available to descendants via `useMaterialColors()`.
   */
  seedColor?: ColorValue;

  /**
   * Material 3 color roles that replace the matching roles of the palette from
   * `colorScheme` and `seedColor`. Roles you omit keep their palette value.
   * The overrides theme Compose children and are returned by `useMaterialColors()`
   * in the same `#RRGGBBAA` form as the other roles.
   */
  colorOverrides?: Partial<MaterialColors>;

  /**
   * The layout direction for the content.
   * Defaults to the current locale direction from I18nManager.
   */
  layoutDirection?: 'leftToRight' | 'rightToLeft';

  /**
   * When `true`, the Compose content will not perform keyboard avoidance behaviour when keyboard is shown.
   * Can be only set once on mount.
   * @default false
   */
  ignoreSafeAreaKeyboardInsets?: boolean;

  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  /** @hidden */
  ref?: Ref<any>;
}

type NativeHostProps = Omit<HostProps, 'colorScheme'> & {
  matchContentsVertical?: boolean;
  matchContentsHorizontal?: boolean;
  colorScheme?: ColorSchemeName;
  seedColor?: ColorValue;
  ref?: Ref<any>;
};

const HostNativeView: React.ComponentType<NativeHostProps> = requireNativeView(
  'ExpoUI',
  'HostView'
);

export function Host(props: HostProps) {
  const {
    matchContents,
    modifiers,
    onLayoutContent,
    layoutDirection,
    colorScheme,
    seedColor,
    colorOverrides,
    ref,
    children,
    ...restProps
  } = props;
  const schemeString = colorScheme === 'light' || colorScheme === 'dark' ? colorScheme : undefined;

  const systemScheme = useRNColorScheme();
  const resolvedScheme = schemeString ?? (systemScheme === 'dark' ? 'dark' : 'light');
  // Key on the normalized values, not the object, so an inline `colorOverrides` object keeps
  // the palette from `useMaterialColors()` reference-stable across re-renders.
  const overridesKey = colorOverrides
    ? JSON.stringify(normalizeColorOverrides(colorOverrides))
    : null;
  const normalizedOverrides = useMemo<Partial<MaterialColors> | undefined>(
    () => (overridesKey ? JSON.parse(overridesKey) : undefined),
    [overridesKey]
  );
  const palette = useMemo(() => {
    const basePalette = getMaterialColors({ scheme: resolvedScheme, seedColor });
    return normalizedOverrides ? { ...basePalette, ...normalizedOverrides } : basePalette;
  }, [resolvedScheme, seedColor, normalizedOverrides]);
  const hostRef = useTextInputHostRef();
  const mergedRef = useMergeRefs(ref, hostRef);
  useWarnIfNestedHost('Jetpack Compose');

  return (
    <HostPaletteContext.Provider value={palette}>
      <TextInputHostProvider hostRef={hostRef}>
        <HostNativeView
          {...restProps}
          modifiers={modifiers}
          matchContentsVertical={
            typeof matchContents === 'object' ? matchContents.vertical : matchContents
          }
          matchContentsHorizontal={
            typeof matchContents === 'object' ? matchContents.horizontal : matchContents
          }
          colorScheme={schemeString}
          seedColor={seedColor}
          colorOverrides={normalizedOverrides}
          onLayoutContent={onLayoutContent}
          layoutDirection={
            layoutDirection ?? (I18nManager.getConstants().isRTL ? 'rightToLeft' : 'leftToRight')
          }
          ref={mergedRef}>
          <NativeTreeContext.Provider value>{children}</NativeTreeContext.Provider>
        </HostNativeView>
      </TextInputHostProvider>
    </HostPaletteContext.Provider>
  );
}

function normalizeColorOverrides(overrides: Partial<MaterialColors>): Partial<MaterialColors> {
  const normalized: Partial<MaterialColors> = {};
  for (const [role, color] of Object.entries(overrides) as [keyof MaterialColors, RgbaHex][]) {
    const hex = color != null ? toRgbaHex(color) : null;
    if (hex) {
      normalized[role] = hex;
    }
  }
  return normalized;
}

// `processColor` returns `0xAARRGGBB`; the palette uses `#RRGGBBAA` like native `toTokenMap()`.
function toRgbaHex(color: RgbaHex): RgbaHex | null {
  const argb = processColor(color);
  if (typeof argb !== 'number') {
    return null;
  }
  const rgba = ((argb << 8) | (argb >>> 24)) >>> 0;
  return `#${rgba.toString(16).padStart(8, '0').toUpperCase()}`;
}
