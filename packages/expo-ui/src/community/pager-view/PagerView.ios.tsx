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
import { useNativeState } from '../../State/useNativeState';
import { Group } from '../../swift-ui/Group';
import { Host } from '../../swift-ui/Host';
import { LazyHStack } from '../../swift-ui/LazyHStack';
import { RNHostView } from '../../swift-ui/RNHostView';
import { ScrollView, type ScrollGeometry, type ScrollPhase } from '../../swift-ui/ScrollView';
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
import { Animation } from '../../swift-ui/modifiers/animation';
import { withAnimation } from '../../swift-ui/withAnimation';

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
 * routes the write through `withAnimation`; if `react-native-worklets` isn't
 * installed, `setPage` falls back to a non-animated jump. Requires iOS 17+.
 * Continuous progress (`onPageScroll`) and scroll state
 * (`onPageScrollStateChanged`) events require iOS 18+.
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
  useEffect(() => {
    setScrollEnabledState(scrollEnabled);
  }, [scrollEnabled]);

  const pageCountRef = useRef(0);

  // Clamp on first render — out-of-range initials produce an id that matches
  // no `Group`, leaving `.scrollPosition(id:)` silently stuck at 0.
  const [clampedInitialPage] = useState(() => {
    const count = Children.count(children);
    if (count === 0) return 0;
    return Math.max(0, Math.min(count - 1, initialPage));
  });

  const activePageState = useNativeState<string | null>(
    clampedInitialPage > 0 ? String(clampedInitialPage) : null
  );

  // The SwiftUI writeback fires for both user swipes and our own imperative
  // writes; dedup against this ref so `onPageSelected` fires once per change.
  const lastSelectedPageRef = useRef(clampedInitialPage);

  const handleScrolledIDChange = (newId: string | null) => {
    if (newId == null) return;
    const page = parseInt(newId, 10);
    if (!Number.isFinite(page)) return;
    if (page !== lastSelectedPageRef.current) {
      lastSelectedPageRef.current = page;
      onPageSelected?.(wrapNativeEvent({ position: page }));
    }
  };

  // Without clamping, an out-of-range id would silently no-op on
  // `.scrollPosition(id:)` instead of jumping to the nearest page.
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
        // `withAnimation` requires `react-native-worklets`; fall back to an
        // instant jump if it isn't installed.
        if (worklets) {
          // `null` would disable animation; `Animation.default` opts into
          // SwiftUI's default paging animation.
          withAnimation(Animation.default, () => {
            'worklet';
            (activePageState as any).setValue({ value: nextId });
          });
        } else {
          (activePageState as any).setValue({ value: nextId });
        }
      },
      setPageWithoutAnimation: (page: number) => {
        const clamped = clampPage(page);
        if (clamped == null) return;
        (activePageState as any).setValue({ value: String(clamped) });
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

  // Toggle the flag rather than splicing the modifier in/out — SwiftUI diffs
  // modifiers by position, so a shifting array resets the ScrollView's content.
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
  // Clamp so rubber-band overscroll doesn't emit `position` outside
  // `[0, pageCount - 1]`. `Math.round` tolerates sub-pixel content sizing.
  const pageCount = Math.max(1, Math.round(geometry.contentWidth / geometry.containerWidth));
  const positionFloat = Math.max(
    0,
    Math.min(pageCount - 1, geometry.contentOffsetX / geometry.containerWidth)
  );
  const position = Math.floor(positionFloat);
  return { position, offset: positionFloat - position };
}

// Mirrors the worklet-ness of the user's callback so the per-frame mapping
// stays on the UI runtime when the user is also on it.
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

