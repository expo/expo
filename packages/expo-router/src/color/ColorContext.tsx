'use client';

import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { type ColorType } from './color';
import { createColor } from './createColor';
import { addColorPaletteListener } from './materialColor';

const ColorContext = createContext<ColorType | null>(null);

/**
 * Holds the current [`Color`](#color) object and refreshes it whenever system colors change.
 * Mounted by `ExpoRoot`, so every `useColor` call in the app shares one native listener.
 */
export function ColorProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const [color, setColor] = useState<ColorType>(createColor);
  // Refresh the color only on a real scheme change, so the identity stays stable on mount.
  const [previousColorScheme, setPreviousColorScheme] = useState(colorScheme);

  useEffect(() => {
    if (previousColorScheme !== colorScheme) {
      setPreviousColorScheme(colorScheme);
      setColor(createColor());
    }
  }, [colorScheme, previousColorScheme]);
  useEffect(() => addColorPaletteListener(() => setColor(createColor())), []);

  return <ColorContext.Provider value={color}>{children}</ColorContext.Provider>;
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
 * import { useColor } from 'expo-router';
 * import { View, Text } from 'react-native';
 *
 * export default function MyComponent() {
 *   const color = useColor();
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
export function useColor(): ColorType {
  const color = use(ColorContext);
  if (color == null) {
    throw new Error(
      "useColor couldn't find the color context, because the component calling it is rendered outside the expo-router app. Move the component inside a route or layout so it renders under ExpoRoot (this happens automatically with the expo-router entry), or in tests render it with renderRouter from expo-router/testing-library."
    );
  }
  return color;
}
