import { requireNativeView } from 'expo';
import type { Ref } from 'react';
import { I18nManager, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import { TextInputHostProvider, useTextInputHostRef } from '../../keyboard';
import { useMergeRefs } from '../../utils/useMergeRefs';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface HostProps extends CommonViewModifierProps {
  /**
   * When true, the host view will update its size in the React Native view tree to match the content's layout from SwiftUI.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };

  /**
   * When true and no explicit size is provided, the host will use the viewport size as the proposed size for SwiftUI layout.
   * This is particularly useful for SwiftUI views that need to fill their available space, such as `Form`.
   * @default false
   */
  useViewportSizeMeasurement?: boolean;

  /**
   * Callback function that is triggered when the SwiftUI content completes its layout.
   * Provides the current dimensions of the content, which may change as the content updates.
   */
  onLayoutContent?: (event: { nativeEvent: { width: number; height: number } }) => void;

  /**
   * The color scheme of the host view.
   */
  colorScheme?: 'light' | 'dark';

  /**
   * Seed color applied to the SwiftUI content as its tint. It propagates
   * through the SwiftUI environment to theme interactive elements (buttons,
   * switches, sliders, and similar controls) rendered by the children.
   */
  seedColor?: ColorValue;

  /**
   * The layout direction for the SwiftUI content.
   * Defaults to the current locale direction from I18nManager.
   */
  layoutDirection?: 'leftToRight' | 'rightToLeft';

  /**
   * Controls which safe area regions the SwiftUI hosting view should ignore.
   *
   * Defaults to `'all'` when `matchContents` is set on either axis. A content-sized host is exactly
   * as large as its content, so an inset would push the content outside the frame React Native laid
   * out. Its content starts at the frame origin like any React Native view, and the app handles
   * insets and keyboard avoidance itself. Pass a value to override the default. On such a host,
   * `'container'` or `'keyboard'` brings back the inset it does not name, and the content can extend
   * past the frame React Native laid out, where it is visible but not tappable.
   * - `'all'` - ignores all safe area insets, including the keyboard.
   * - `'container'` - ignores only the container safe area (notch, home indicator, status and navigation bars). The keyboard safe area still applies.
   * - `'keyboard'` - ignores only the keyboard safe area.
   */
  ignoreSafeArea?: 'all' | 'container' | 'keyboard';

  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  /** @hidden */
  ref?: Ref<any>;
}

const HostNativeView: React.ComponentType<
  HostProps & {
    matchContentsVertical?: boolean;
    matchContentsHorizontal?: boolean;
    ref?: Ref<any>;
  }
> = requireNativeView('ExpoUI', 'HostView');

/**
 * A hosting component for SwiftUI views.
 */
export function Host(props: HostProps) {
  const {
    matchContents,
    onLayoutContent,
    ignoreSafeArea,
    modifiers,
    layoutDirection,
    seedColor,
    ref,
    ...restProps
  } = props;
  const hostRef = useTextInputHostRef();
  const mergedRef = useMergeRefs(ref, hostRef);
  const matchContentsVertical =
    typeof matchContents === 'object' ? matchContents.vertical : matchContents;
  const matchContentsHorizontal =
    typeof matchContents === 'object' ? matchContents.horizontal : matchContents;
  // A content-sized host is exactly as large as its content, so a safe-area inset would push the
  // content outside the frame React Native laid out. Callers can still pass a value to override.
  const isContentSized = !!matchContentsVertical || !!matchContentsHorizontal;

  return (
    <TextInputHostProvider hostRef={hostRef}>
      <HostNativeView
        modifiers={modifiers}
        {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
        matchContentsVertical={matchContentsVertical}
        matchContentsHorizontal={matchContentsHorizontal}
        onLayoutContent={onLayoutContent}
        layoutDirection={
          layoutDirection ?? (I18nManager.getConstants().isRTL ? 'rightToLeft' : 'leftToRight')
        }
        ignoreSafeArea={ignoreSafeArea ?? (isContentSized ? 'all' : undefined)}
        seedColor={seedColor}
        {...restProps}
        ref={mergedRef}
      />
    </TextInputHostProvider>
  );
}
