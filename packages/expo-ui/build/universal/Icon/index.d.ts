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
export declare function Icon(_props: IconProps): null;
export declare namespace Icon {
    var select: (_spec: IconSelectSpec) => SFSymbol | ImageSourcePropType;
}
export * from './types';
//# sourceMappingURL=index.d.ts.map