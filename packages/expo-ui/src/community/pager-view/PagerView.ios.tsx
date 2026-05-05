import {
  Children,
  isValidElement,
  useImperativeHandle,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Platform } from 'react-native';

import { wrapNativeEvent, type PagerViewProps } from './types';
import { worklets } from '../../State/optionalWorklets';
import { Group } from '../../swift-ui/Group';
import { HStack } from '../../swift-ui/HStack';
import { Host } from '../../swift-ui/Host';
import { RNHostView } from '../../swift-ui/RNHostView';
import {
  ScrollView,
  type ScrollGeometry,
  type ScrollPhase,
  type ScrollViewRef,
} from '../../swift-ui/ScrollView';
import {
  containerRelativeFrame,
  id,
  scrollDisabled,
  scrollTargetBehavior,
  scrollTargetLayout,
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
 * Renders a SwiftUI `ScrollView` with paging behavior. Initial placement,
 * imperative navigation, and `onPageSelected` are driven by SwiftUI's
 * `.scrollPosition(id:)` binding, which requires iOS 17+. Continuous
 * progress (`onPageScroll`) and scroll state (`onPageScrollStateChanged`)
 * additionally require iOS 18+ — on iOS 17 the pager still works but those
 * specific events do not fire.
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

  const scrollViewRef = useRef<ScrollViewRef>(null);

  // Dedup against the last fired page — scrollPosition's writeback fires
  // for both user swipes and our own programmatic writes.
  const lastSelectedPageRef = useRef(initialPage);

  const handleScrolledIDChange = (id: string | null) => {
    if (id == null) return;
    const page = parseInt(id, 10);
    if (!Number.isFinite(page)) return;
    if (page !== lastSelectedPageRef.current) {
      lastSelectedPageRef.current = page;
      onPageSelected?.(wrapNativeEvent({ position: page }));
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      setPage: (page: number) => {
        scrollViewRef.current?.scrollToId(String(page), true);
      },
      setPageWithoutAnimation: (page: number) => {
        scrollViewRef.current?.scrollToId(String(page), false);
      },
      setScrollEnabled: setScrollEnabledState,
    }),
    []
  );

  // Only wire onScrollGeometryChange when the consumer asks for continuous
  // progress — onPageSelected is already covered by the scrollPosition writeback.
  const handleScrollGeometry = onPageScroll ? buildHandleScrollGeometry(onPageScroll) : undefined;

  const handleScrollPhase = onPageScrollStateChanged
    ? (phase: ScrollPhase) => {
        onPageScrollStateChanged(wrapNativeEvent({ pageScrollState: phaseToPageState(phase) }));
      }
    : undefined;

  const pages = Children.toArray(children)
    .filter((child): child is ReactElement => isValidElement(child))
    .map((child, index) => (
      <Group
        key={child.key ?? String(index)}
        modifiers={[containerRelativeFrame({ axes: 'horizontal' }), id(String(index))]}>
        <RNHostView>{child}</RNHostView>
      </Group>
    ));

  // Toggle the value rather than splicing the modifier in/out — SwiftUI
  // diffs modifiers by position, and a shifting array shape resets the
  // ScrollView's content (the page goes blank on disable/enable).
  const modifiers = [scrollTargetBehavior('paging'), scrollDisabled(!scrollEnabledState)];

  return (
    <Host style={style ?? { flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        axes="horizontal"
        showsIndicators={false}
        initialScrollId={initialPage > 0 ? String(initialPage) : undefined}
        modifiers={modifiers}
        onScrolledIDChange={handleScrolledIDChange}
        onScrollPhaseChange={handleScrollPhase}
        onScrollGeometryChange={handleScrollGeometry}>
        <HStack spacing={0} modifiers={[scrollTargetLayout()]}>
          {pages}
        </HStack>
      </ScrollView>
    </Host>
  );
}

function geometryToPageScroll(geometry: ScrollGeometry): { position: number; offset: number } {
  'worklet';
  const positionFloat = geometry.contentOffsetX / geometry.containerWidth;
  const position = Math.floor(positionFloat);
  return { position, offset: positionFloat - position };
}

/**
 * Returns the right `ScrollView.onScrollGeometryChange` handler for the
 * consumer's `onPageScroll` callback. If the consumer's callback is a
 * worklet, the wrapper is also a worklet so the per-frame mapping runs on
 * the UI runtime; otherwise the wrapper is a regular JS function.
 *
 * The worklet branch must be a literal arrow with `'worklet'` as the first
 * statement so babel-plugin-worklets can serialize it for the UI runtime;
 * sharing a single closure between the branches isn't possible.
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
