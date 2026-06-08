import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * Scroll phase emitted by the `onScrollPhaseChange(...)` modifier. Mirrors
 * SwiftUI's `ScrollPhase` (iOS 18+).
 */
export type ScrollPhase = 'idle' | 'tracking' | 'interacting' | 'animating' | 'decelerating';

/**
 * Snapshot of a `ScrollView`'s scroll geometry, emitted by the
 * `useScrollGeometryChange(...)` and `onScrollPhaseChange(...)` modifiers
 * (iOS 18+).
 */
export type ScrollGeometry = {
  /** Horizontal content offset, in points. */
  contentOffsetX: number;
  /** Vertical content offset, in points. */
  contentOffsetY: number;
  /** Width of the visible scroll container, in points. */
  containerWidth: number;
  /** Height of the visible scroll container, in points. */
  containerHeight: number;
  /** Total width of the scrollable content, in points. */
  contentWidth: number;
  /** Total height of the scrollable content, in points. */
  contentHeight: number;
};

export type ScrollViewProps = {
  children: React.ReactNode;
  /**
   * The scrollable axes. Pass `'both'` to enable 2D (horizontal + vertical) scrolling.
   * @default 'vertical'
   */
  axes?: 'vertical' | 'horizontal' | 'both';
  /**
   * Whether to show scroll indicators. For richer visibility control (e.g. `'never'`)
   * or per-axis control, use the `scrollIndicators(...)` modifier instead.
   * @default true
   */
  showsIndicators?: boolean;
} & CommonViewModifierProps;

const ScrollViewNativeView: React.ComponentType<ScrollViewProps> = requireNativeView(
  'ExpoUI',
  'ScrollViewComponent'
);

/**
 * SwiftUI `ScrollView` wrapper. To control scroll position, pair this with the
 * `scrollPosition(state, { onChange })` modifier and a `useNativeState`-backed
 * id. Write `state.value = targetId` for an instant scroll, or wrap the write
 * in `withAnimation(...)` from `@expo/ui/swift-ui` for an animated one.
 */
export function ScrollView(props: ScrollViewProps) {
  const { modifiers, ...restProps } = props;

  return (
    <ScrollViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
