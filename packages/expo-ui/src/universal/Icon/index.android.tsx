import { Box, Icon as ComposeIcon } from '@expo/ui/jetpack-compose';
import { size as sizeModifier } from '@expo/ui/jetpack-compose/modifiers';
import type { ImageSourcePropType } from 'react-native';

import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';
import type { IconName, IconProps, IconSelectSpec } from './types';

function resolveAndroidSource(name: IconName): ImageSourcePropType | undefined {
  if (name && typeof name === 'object' && 'android' in name) {
    return name.android;
  }
  if (typeof name === 'string') {
    // Bare SF Symbol string passed on Android — not renderable.
    return undefined;
  }
  return name;
}

/**
 * Universal `Icon` component. On Android, renders a Jetpack Compose `Icon`
 * from an XML vector drawable asset (typically from `@expo/material-symbols`).
 *
 * When `onPress` is provided, the icon is wrapped in a `Box` so the
 * `clickable` modifier (and the other universal layout / behavior modifiers)
 * attach to a container that reliably forwards pointer events. Material 3
 * `Icon` adds its own semantics with `Role.Image`, which can mask a
 * `clickable` applied directly to it. With no `onPress`, the bare Compose
 * `Icon` is rendered for a leaner native tree.
 */
export function Icon({
  name,
  size,
  color,
  accessibilityLabel,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: IconProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  if (hidden) return null;

  const source = resolveAndroidSource(name);
  if (source == null) return null;

  const modifiers = transformToModifiers(
    style,
    { onPress, disabled, hidden, testID },
    extraModifiers
  );

  if (onPress) {
    // Pin the wrapping Box to the icon's size so it doesn't collapse to 0×0
    // while the native IconView swaps painters between source changes — that
    // would shift surrounding layout for a frame on every state-driven swap.
    const boxModifiers = size != null ? [sizeModifier(size, size), ...modifiers] : modifiers;
    return (
      <Box modifiers={boxModifiers}>
        <ComposeIcon
          source={source}
          size={size}
          tint={color}
          contentDescription={accessibilityLabel}
        />
      </Box>
    );
  }

  return (
    <ComposeIcon
      source={source}
      size={size}
      tint={color}
      contentDescription={accessibilityLabel}
      modifiers={modifiers}
    />
  );
}

Icon.select = (spec: IconSelectSpec) => {
  const value = spec.android;
  if (value != null && typeof (value as { then?: unknown }).then === 'function') {
    throw new Error(
      'Icon.select received a Promise for the Android side, which means a dynamic ' +
        "import('...') in the source was not transformed at build time. The Babel " +
        'plugin `@expo/ui/babel-plugin` is required to handle this form. It is auto-loaded ' +
        'by `babel-preset-expo`; if you are using a custom Babel config, add it manually:\n' +
        "  plugins: ['@expo/ui/babel-plugin']\n" +
        "Alternatively, replace `import('...')` with `require('...')` in your `Icon.select` call."
    );
  }
  return value as ImageSourcePropType;
};

export * from './types';
