import { Image as SwiftUIImage } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';

import { transformToModifiers } from '../transformStyle';
import type { IconName, IconProps, IconSelectSpec } from './types';

function resolveIosName(name: IconName): SFSymbol | undefined {
  if (typeof name === 'string') {
    return name as SFSymbol;
  }
  if (name && typeof name === 'object' && 'ios' in name) {
    return name.ios;
  }
  // Bare Android asset passed on iOS — nothing renderable. Returning undefined
  // makes SwiftUI render an empty Image rather than crashing.
  return undefined;
}

/**
 * Universal `Icon` component. On iOS, renders an SF Symbol via SwiftUI's
 * `Image(systemName:)`.
 */
export function Icon({
  name,
  size,
  color,
  style,
  onPress,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: IconProps) {
  const systemName = resolveIosName(name);
  const modifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  return (
    <SwiftUIImage
      systemName={systemName}
      size={size}
      color={color}
      onPress={onPress}
      modifiers={modifiers}
    />
  );
}

Icon.select = (spec: IconSelectSpec) => spec.ios;

export * from './types';
