import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

const NATIVE_LAYOUT_STYLE: ViewStyle = { display: 'contents' };

/**
 * Same as `requireNativeView`, but for views laid out by SwiftUI or Compose instead of Yoga.
 * Sets `display: contents` style and `disableForceFlatten` prop on the native view.
 */
export function requireNativeLayoutView<P>(
  moduleName: string,
  viewName?: string
): ComponentType<P> {
  const NativeView = requireNativeView<any>(moduleName, viewName);

  function NativeLayoutView(props: P & { style?: StyleProp<ViewStyle> }) {
    // Keep it last so the passed style can't override `display`
    const style = props.style ? [props.style, NATIVE_LAYOUT_STYLE] : NATIVE_LAYOUT_STYLE;
    return <NativeView {...props} style={style} disableForceFlatten />;
  }
  NativeLayoutView.displayName = viewName ?? moduleName;

  return NativeLayoutView as ComponentType<P>;
}
