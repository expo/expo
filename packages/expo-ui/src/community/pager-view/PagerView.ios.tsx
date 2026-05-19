import {
  Children,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Platform } from 'react-native';

import { wrapNativeEvent, type PagerViewProps } from './types';
import { worklets } from '../../State/optionalWorklets';
import { useNativeState, type ObservableState } from '../../State/useNativeState';
import { Group } from '../../swift-ui/Group';
import { Host } from '../../swift-ui/Host';
import { LazyHStack } from '../../swift-ui/LazyHStack';
import { RNHostView } from '../../swift-ui/RNHostView';
import { ScrollView, type ScrollGeometry, type ScrollPhase } from '../../swift-ui/ScrollView';
import { Animation } from '../../swift-ui/modifiers/animation';
import { withAnimation } from '../../swift-ui/withAnimation';
import {
  containerRelativeFrame,
  id,
  onScrollPhaseChange,
  scrollDisabled,
  scrollPosition,
  scrollTargetBehavior,
  scrollTargetLayout,
  useScrollGeometryChange,
} from '../../swift-ui/modifiers';

function phaseToPageState(phase: ScrollPhase): 'idle' | 'dragging' | 'settling' {
  switch (phase) {
    case 'idle':
      return 'idle';
    case 'tracking':
    case 'interacting':
      return 'dragging';
    case 'animating':
    case 'decelerating':
      return 'settling';
  }
}

/**
 * Drop-in replacement for `react-native-pager-view` on iOS.
 *
 * Renders a SwiftUI `ScrollView` with paging behavior. Scroll position is the
 * single source of truth: an `ObservableState` bound through the
 * `scrollPosition` modifier drives initial placement, user-swipe writeback,
 * and imperative `setPage` / `setPageWithoutAnimation`. The animated path
 * routes the write through `withAnimation` so the state mutation lands inside
 * SwiftUI's animation transaction; if `react-native-worklets` isn't
 * installed, `setPage` falls back to a non-animated jump. Requires iOS 17+.
 * Continuous progress (`onPageScroll`) and scroll state
 * (`onPageScrollStateChanged`) require iOS 18+ — on iOS 17 the pager still
 * works but those specific events do not fire.
 */
export function PagerView(props: PagerViewProps) {
  const {
    ref,
    initialPage = 0,
    scrollEnabled = true,
    onPageScroll,
    onPageScrollStateChanged,
    onPageSelected,
    children,
    style,
  } = props;

  warnIfPreIOS18ScrollCallbacksDropped(onPageScroll, onPageScrollStateChanged);

  const [scrollEnabledState, setScrollEnabledState] = useState(scrollEnabled);
  // Keep local state in sync with the prop so consumers can drive it
  // declaratively — matches upstream `react-native-pager-view`'s contract.
  // The imperative `setScrollEnabled` still works for callers that want to
  // toggle without re-rendering.
  useEffect(() => {
    setScrollEnabledState(scrollEnabled);
  }, [scrollEnabled]);

  // Mirrors current page count so the imperative `setPage` methods can clamp
  // out-of-range indices to a valid id. Reading children count at render keeps
  // this current across page add/remove without an effect.
  const pageCountRef = useRef(0);

  // Single source of truth for the active page id — bound to SwiftUI's
  // `.scrollPosition(id:)` via the `scrollPosition` modifier. JS writes drive
  // imperative navigation; SwiftUI writebacks (user swipes) update us so
  // `onPageSelected` fires uniformly for both directions.
  const activePageState = useNativeState<string | null>(
    initialPage > 0 ? String(initialPage) : null
  );

  // Dedup against the last fired page — the writeback fires for both user
  // swipes and our own imperative writes.
  const lastSelectedPageRef = useRef(initialPage);

  const handleScrolledIDChange = (newId: string | null) => {
    if (newId == null) return;
    const page = parseInt(newId, 10);
    if (!Number.isFinite(page)) return;
    if (page !== lastSelectedPageRef.current) {
      lastSelectedPageRef.current = page;
      onPageSelected?.(wrapNativeEvent({ position: page }));
    }
  };

  // Clamps to `[0, pageCount - 1]` to match Android's `coerceIn` behavior and
  // the documented "out-of-range indices are silently ignored" contract —
  // without clamping, SwiftUI's `.scrollPosition(id:)` would write an id that
  // matches no page and stay put, diverging from Android.
  const clampPage = (page: number): number | null => {
    const count = pageCountRef.current;
    if (count === 0 || !Number.isFinite(page)) return null;
    return Math.max(0, Math.min(count - 1, page));
  };

  useImperativeHandle(
    ref,
    () => ({
      setPage: (page: number) => {
        const clamped = clampPage(page);
        if (clamped == null) return;
        const nextId = String(clamped);
        // `withAnimation` needs `react-native-worklets` to ship the body to
        // the UI runtime. Without it, fall back to a non-animated jump rather
        // than throwing — the page still changes, just instantly.
        if (worklets) {
          // `Animation.default` (not `null`) — SwiftUI treats `withAnimation(nil)`
          // as an explicit "disable animation", so we must pass an actual
          // animation to get the default paging behavior.
          withAnimation(Animation.default, () => {
            'worklet';
            (activePageState as any).setValue({ value: nextId });
          });
        } else {
          writePageOnUI(activePageState, nextId);
        }
      },
      setPageWithoutAnimation: (page: number) => {
        const clamped = clampPage(page);
        if (clamped == null) return;
        writePageOnUI(activePageState, String(clamped));
      },
      setScrollEnabled: setScrollEnabledState,
    }),
    [activePageState]
  );

  const handleScrollGeometry = useMemo(
    () => (onPageScroll ? buildHandleScrollGeometry(onPageScroll) : undefined),
    [onPageScroll]
  );
  const geometryModifier = useScrollGeometryChange(handleScrollGeometry);

  const phaseModifier = onPageScrollStateChanged
    ? onScrollPhaseChange((phase) =>
        onPageScrollStateChanged(wrapNativeEvent({ pageScrollState: phaseToPageState(phase) }))
      )
    : null;

  const pages = Children.toArray(children)
    .filter((child): child is ReactElement => isValidElement(child))
    .map((child, index) => (
      <Group
        key={child.key ?? String(index)}
        modifiers={[containerRelativeFrame({ axes: 'horizontal' }), id(String(index))]}>
        <RNHostView>{child}</RNHostView>
      </Group>
    ));
  pageCountRef.current = pages.length;

  // Toggle the value rather than splicing the modifier in/out — SwiftUI
  // diffs modifiers by position, and a shifting array shape resets the
  // ScrollView's content (the page goes blank on disable/enable).
  const modifiers = [
    scrollTargetBehavior('paging'),
    scrollDisabled(!scrollEnabledState),
    scrollPosition(activePageState, { onChange: handleScrolledIDChange }),
    ...(geometryModifier ? [geometryModifier] : []),
    ...(phaseModifier ? [phaseModifier] : []),
  ];

  return (
    <Host style={style ?? { flex: 1 }}>
      <ScrollView axes="horizontal" showsIndicators={false} modifiers={modifiers}>
        <LazyHStack spacing={0} modifiers={[scrollTargetLayout()]}>
          {pages}
        </LazyHStack>
      </ScrollView>
    </Host>
  );
}

function geometryToPageScroll(geometry: ScrollGeometry): { position: number; offset: number } {
  'worklet';
  // Clamp to `[0, pageCount - 1]` so rubber-band overscroll doesn't emit
  // `position = -1` at the start edge or `position = pageCount` at the end —
  // upstream `react-native-pager-view` reports `position ∈ [0, pageCount - 1]`
  // and `offset ∈ [0, 1)`. `Math.round` tolerates sub-pixel content sizing.
  const pageCount = Math.max(1, Math.round(geometry.contentWidth / geometry.containerWidth));
  const positionFloat = Math.max(
    0,
    Math.min(pageCount - 1, geometry.contentOffsetX / geometry.containerWidth)
  );
  const position = Math.floor(positionFloat);
  return { position, offset: positionFloat - position };
}

/**
 * Returns the right geometry handler for the consumer's `onPageScroll`
 * callback. If the consumer's callback is a worklet, the wrapper is also a
 * worklet so the per-frame mapping runs on the UI runtime; otherwise the
 * wrapper is a regular JS function. The `useScrollGeometryChange` hook
 * detects the wrapper's worklet-ness from its prototype.
 */
function buildHandleScrollGeometry(
  userOnPageScroll: NonNullable<PagerViewProps['onPageScroll']>
): (geometry: ScrollGeometry) => void {
  if (worklets?.isWorkletFunction?.(userOnPageScroll)) {
    return (geometry) => {
      'worklet';
      if (geometry.containerWidth <= 0) return;
      userOnPageScroll(wrapNativeEvent(geometryToPageScroll(geometry)));
    };
  }
  return (geometry) => {
    if (geometry.containerWidth <= 0) return;
    userOnPageScroll(wrapNativeEvent(geometryToPageScroll(geometry)));
  };
}

let didWarnPreIOS18 = false;
/**
 * Surfaces the silent no-op of `onPageScroll` and `onPageScrollStateChanged`
 * on iOS < 18 (the underlying SwiftUI APIs are iOS 18+).
 */
function warnIfPreIOS18ScrollCallbacksDropped(
  onPageScroll: PagerViewProps['onPageScroll'],
  onPageScrollStateChanged: PagerViewProps['onPageScrollStateChanged']
) {
  if (!__DEV__ || didWarnPreIOS18) return;
  if (!onPageScroll && !onPageScrollStateChanged) return;
  const major = parseInt(String(Platform.Version), 10);
  if (Number.isFinite(major) && major < 18) {
    didWarnPreIOS18 = true;
    console.warn(
      `[expo-ui PagerView] onPageScroll and onPageScrollStateChanged require iOS 18+ ` +
        `and will not fire on iOS ${Platform.Version}. Guard with Platform.Version or ` +
        `provide a fallback for older iOS targets.`
    );
  }
}

// Routes the page-id write to the UI runtime when worklets are available so
// SwiftUI observes the change on the same thread it diffs from. Without
// worklets, falls back to a JS-thread write — the dev warning from
// `defineValueProperty` will fire, but the page still changes.
function writePageOnUI(state: ObservableState<string | null>, nextId: string): void {
  if (worklets) {
    worklets.scheduleOnUI(() => {
      'worklet';
      (state as any).setValue({ value: nextId });
    });
  } else {
    state.value = nextId;
  }
}
