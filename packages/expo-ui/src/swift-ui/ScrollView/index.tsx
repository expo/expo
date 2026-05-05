import { requireNativeView } from 'expo';
import type { Ref } from 'react';

import { worklets } from '../../State/optionalWorklets';
import { useWorkletProp } from '../../State/useWorkletProp';
import { getStateId } from '../../State/utils';
import type { ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * Scroll phase emitted by `onScrollPhaseChange`. Mirrors SwiftUI's `ScrollPhase`
 * (iOS 18+).
 */
export type ScrollPhase = 'idle' | 'tracking' | 'interacting' | 'animating' | 'decelerating';

/**
 * Snapshot of a `ScrollView`'s scroll geometry, emitted by
 * `onScrollGeometryChange` (iOS 18+).
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

/**
 * Imperative handle exposed by `ScrollView` via its `ref`.
 */
export type ScrollViewRef = {
  /**
   * Scrolls so the child carrying `id(targetId)` is aligned with the leading
   * edge of the scroll container. When `animated` is true the transition is
   * wrapped in SwiftUI's `withAnimation`.
   */
  scrollToId: (targetId: string, animated: boolean) => Promise<void>;
};

export type ScrollViewProps = {
  ref?: Ref<ScrollViewRef>;
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
  /**
   * Initial id of the leading visible target — backed by SwiftUI's
   * `.scrollPosition(id:)`. Read once on first construction; later changes
   * are ignored. To navigate after mount, use `ref.scrollToId(...)`.
   *
   * Requires iOS 17 or later. No-op on earlier iOS versions.
   */
  initialScrollId?: string;
  /**
   * Fires when the leading visible target id changes — e.g., after a
   * user-driven swipe settles, or after an imperative `scrollToId` call
   * applies. The argument is the new leading id, or `null` if the scroll
   * view has no resolved target.
   *
   * Requires iOS 17 or later. No-op on earlier iOS versions.
   */
  onScrolledIDChange?: (id: string | null) => void;
  /**
   * Fires when SwiftUI's scroll phase changes (e.g., user begins dragging,
   * the scroll view starts decelerating, or scrolling settles to idle). The
   * second argument is the scroll geometry sampled at the phase transition,
   * useful for reading the final offset on settle without subscribing to
   * per-frame `onScrollGeometryChange`.
   *
   * Requires iOS 18 or later. No-op on earlier iOS versions.
   */
  onScrollPhaseChange?: (phase: ScrollPhase, geometry: ScrollGeometry) => void;
  /**
   * Fires when the scroll geometry changes — i.e., on every scroll update
   * and on container/content size changes. Use to drive continuous progress
   * UI such as page indicators, parallax, or fractional offsets.
   *
   * If the callback is marked with the `'worklet'` directive, it runs
   * synchronously on the UI thread; otherwise it is delivered asynchronously
   * as a regular JS event.
   *
   * Requires iOS 18 or later. No-op on earlier iOS versions.
   */
  onScrollGeometryChange?: (geometry: ScrollGeometry) => void;
} & CommonViewModifierProps;

type NativeScrollViewProps = Omit<
  ScrollViewProps,
  'onScrollPhaseChange' | 'onScrollGeometryChange' | 'onScrolledIDChange'
> &
  ViewEvent<'onScrollPhaseChange', { phase: ScrollPhase; geometry: ScrollGeometry }> &
  ViewEvent<'onScrollGeometryChange', ScrollGeometry> &
  ViewEvent<'onScrolledIDChange', { id: string | null }> & {
    onScrollGeometryChangeSync?: number | null;
  };

const ScrollViewNativeView: React.ComponentType<NativeScrollViewProps> = requireNativeView(
  'ExpoUI',
  'ScrollViewComponent'
);

export function ScrollView(props: ScrollViewProps) {
  const {
    modifiers,
    onScrollPhaseChange,
    onScrollGeometryChange,
    onScrolledIDChange,
    ...restProps
  } = props;

  const isGeometryWorklet =
    !!onScrollGeometryChange && !!worklets?.isWorkletFunction?.(onScrollGeometryChange);
  const geometryWorkletCallback = useWorkletProp(
    isGeometryWorklet ? onScrollGeometryChange : undefined,
    'onScrollGeometryChange'
  );

  return (
    <ScrollViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onScrollPhaseChange={
        onScrollPhaseChange
          ? ({ nativeEvent: { phase, geometry } }) => onScrollPhaseChange(phase, geometry)
          : undefined
      }
      onScrollGeometryChange={
        !isGeometryWorklet && onScrollGeometryChange
          ? ({ nativeEvent }) => onScrollGeometryChange(nativeEvent)
          : undefined
      }
      onScrollGeometryChangeSync={getStateId(geometryWorkletCallback)}
      onScrolledIDChange={
        onScrolledIDChange ? ({ nativeEvent: { id } }) => onScrolledIDChange(id) : undefined
      }
    />
  );
}
