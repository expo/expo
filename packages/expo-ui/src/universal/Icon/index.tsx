import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { IconProps, IconSelectSpec } from './types';

/**
 * A platform-native icon. Renders an XML vector drawable (typically from
 * `@expo/material-symbols`) on Android and an SF Symbol on iOS.
 *
 * @platform android
 * @platform ios
 *
 * @example With `Icon.select`, hoisted (handy when the same icon is reused)
 * ```tsx
 * const STAR = Icon.select({
 *   ios: 'star.fill',
 *   android: import('@expo/material-symbols/star.xml'),
 * });
 *
 * <Icon name={STAR} size={24} color="orange" />
 * ```
 *
 * @example With `Icon.select`, inline at the call site
 * ```tsx
 * <Icon
 *   name={Icon.select({
 *     ios: 'star.fill',
 *     android: import('@expo/material-symbols/star.xml'),
 *   })}
 *   size={24}
 * />
 * ```
 *
 * @example Plain `{ ios, android }` object — does NOT tree-shake
 * Both sides ship to both platforms. Prefer `Icon.select` when bundle size
 * matters.
 * ```tsx
 * <Icon
 *   name={{
 *     ios: 'star.fill',
 *     android: require('@expo/material-symbols/star.xml'),
 *   }}
 *   size={24}
 * />
 * ```
 *
 * @example In an `.android.tsx` file, import or `require()` an XML asset
 * ```tsx
 * import StarIcon from '@expo/material-symbols/star.xml';
 *
 * <Icon name={StarIcon} size={24} />
 * ```
 *
 * @example In a `.ios.tsx` file, pass an SF Symbol string directly
 * ```tsx
 * <Icon name="star.fill" size={24} />
 * ```
 */
export function Icon(_props: IconProps) {
  return null;
}

/**
 * Picks the icon source for the current platform — `android` on Android,
 * `ios` on iOS.
 *
 * Pair with `@expo/ui/babel-plugin` to strip the unused side per platform.
 *
 * @example
 * ```tsx
 * const STAR = Icon.select({
 *   ios: 'star.fill',
 *   android: import('@expo/material-symbols/star.xml'),
 * });
 *
 * <Icon name={STAR} size={24} />
 * ```
 */
Icon.select = (_spec: IconSelectSpec): SFSymbol | ImageSourcePropType => {
  // Web `<Icon>` renders nothing, so the return value is never consumed.
  // The cast keeps the call-site type matching iOS/Android so consumers don't
  // have to handle a wider union just to support web.
  return undefined as unknown as SFSymbol | ImageSourcePropType;
};

export * from './types';
