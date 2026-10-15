console.warn(
  '`expo-router/unstable-native-tabs` is deprecated. Use `expo-router/native-tabs` instead.'
);

/** @deprecated Use `expo-router/native-tabs` instead. */
export type {
  NativeTabsTriggerLabelProps,
  SrcIcon,
  SFSymbolIcon,
  XcassetIcon,
  DrawableIcon,
  MaterialIcon,
  NativeTabsTriggerIconProps,
  NativeTabsTriggerBadgeProps,
  NativeTabsBottomAccessoryProps,
} from './native-tabs/common/elements';
/** @deprecated Use `expo-router/native-tabs` instead. */
export type {
  IconRenderingMode,
  NativeTabsProps,
  NativeTabTriggerProps,
  NativeTabsLabelStyle,
  NativeTabsHostNativeProps,
  SymbolOrImageSource,
  NativeTabsTabBarItemLabelVisibilityMode,
  NativeTabsBlurEffect,
  NativeTabsTabBarMinimizeBehavior,
  NativeTabsTabBarItemRole,
} from './native-tabs/types';
/** @deprecated Use `NativeTabTrigger` from `expo-router/native-tabs` instead. */
export { NativeTabTrigger } from './native-tabs/NativeTabTrigger';
/** @deprecated Use `NativeTabs` from `expo-router/native-tabs` instead. */
export { NativeTabs } from './native-tabs/NativeTabs';
