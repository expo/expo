import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { type ColorType } from './color';
import { createColor } from './createColor';
import { addColorPaletteListener } from './materialColor';

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

  useEffect(() => {
    setColor(createColor());
  }, [colorScheme]);
  useEffect(() => addColorPaletteListener(() => setColor(createColor())), []);

  return color;
}
