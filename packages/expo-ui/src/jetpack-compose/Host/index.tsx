import { requireNativeView } from 'expo';
import { useMemo } from 'react';
import {
  type ColorSchemeName,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
  I18nManager,
  useColorScheme as useRNColorScheme,
} from 'react-native';

import { getMaterialColors, HostPaletteContext } from '../colors';
import { type PrimitiveBaseProps } from '../layout';

export type HostProps = {
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
} & PrimitiveBaseProps;

type NativeHostProps = Omit<HostProps, 'colorScheme'> & {
  matchContentsVertical?: boolean;
  matchContentsHorizontal?: boolean;
  colorScheme?: ColorSchemeName;
  seedColor?: ColorValue;
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
    ...restProps
  } = props;
  const schemeString = colorScheme === 'light' || colorScheme === 'dark' ? colorScheme : undefined;

  const systemScheme = useRNColorScheme();
  const resolvedScheme = schemeString ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const palette = useMemo(
    () => getMaterialColors({ scheme: resolvedScheme, seedColor }),
    [resolvedScheme, seedColor]
  );

  return (
    <HostPaletteContext.Provider value={palette}>
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
        onLayoutContent={onLayoutContent}
        layoutDirection={
          layoutDirection ?? (I18nManager.getConstants().isRTL ? 'rightToLeft' : 'leftToRight')
        }
      />
    </HostPaletteContext.Provider>
  );
}
