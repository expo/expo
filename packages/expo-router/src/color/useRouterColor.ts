import { useEffect, useReducer, useState } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

import { type ColorType } from './color';
import { createColor } from './createColor';
import { addColorPaletteListener } from './materialColor';

/**
 * Re-renders on light/dark scheme changes and on native Material You palette
 * change events, without exposing any value.
 *
 * @internal
 */
export function useColorPaletteVersion(): void {
  useColorScheme();
  const [, increment] = useReducer((current: number) => current + 1, 0);
  useEffect(() => addColorPaletteListener(increment), []);
}

/**
 * Returns the [`Color`](#color) API object and re-renders whenever system colors change:
 * when the system switches between light and dark mode, and when the user changes their
 * Material You colors (for example, by changing the wallpaper) on Android 12 and above.
 *
 * The returned object gets a new identity whenever colors may have changed, so it is safe
 * to use with React Compiler and as a dependency of `useMemo` or `useEffect`. Prefer it over
 * reading the global `Color` object inside components.
 *
 * @example
 * ```tsx
 * import { useRouterColor } from 'expo-router';
 * import { View, Text } from 'react-native';
 *
 * export default function MyComponent() {
 *   const color = useRouterColor();
 *   return (
 *     <View style={{ flex: 1, backgroundColor: color.android.dynamic.surface }}>
 *       <Text style={{ color: color.android.dynamic.onSurface }}>Hello, World!</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * @platform android
 * @platform ios
 */
export function useRouterColor(): ColorType {
  const colorScheme = useColorScheme();
  const [color, setColor] = useState<ColorType>(createColor);
  // Adjust state during render on scheme changes (avoids an extra effect pass).
  const [previousScheme, setPreviousScheme] = useState<ColorSchemeName>(colorScheme);
  if (previousScheme !== colorScheme) {
    setPreviousScheme(colorScheme);
    setColor(createColor());
  }
  useEffect(() => addColorPaletteListener(() => setColor(createColor())), []);
  return color;
}
