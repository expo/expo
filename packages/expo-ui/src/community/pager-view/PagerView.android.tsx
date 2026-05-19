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
import { StyleSheet } from 'react-native';

import { wrapNativeEvent, type PagerViewProps } from './types';
import { worklets } from '../../State/optionalWorklets';
import { HorizontalPager, type HorizontalPagerHandle } from '../../jetpack-compose/HorizontalPager';
import { Host } from '../../jetpack-compose/Host';
import { RNHostView } from '../../jetpack-compose/RNHostView';
import { type BuiltinShape, Shapes, clip, fillMaxSize } from '../../jetpack-compose/modifiers';

/**
 * Drop-in replacement for `react-native-pager-view` on Android.
 * Renders a Jetpack Compose `HorizontalPager`.
 */
export function PagerView(props: PagerViewProps) {
  const {
    ref,
    initialPage = 0,
    scrollEnabled = true,
    pageMargin,
    offscreenPageLimit,
    layoutDirection,
    onPageScroll,
    onPageScrollStateChanged,
    onPageSelected,
    children,
    style,
  } = props;

  const pagerRef = useRef<HorizontalPagerHandle>(null);
  const [scrollEnabledState, setScrollEnabledState] = useState(scrollEnabled);
  // Keep local state in sync with the prop so consumers can drive it
  // declaratively — matches upstream `react-native-pager-view`'s contract.
  // The imperative `setScrollEnabled` reuses this setter, so it does trigger
  // a re-render — unlike upstream's UIManager-direct path.
  useEffect(() => {
    setScrollEnabledState(scrollEnabled);
  }, [scrollEnabled]);

  // Synthesize pager-view's `idle | dragging | settling` state machine from
  // Compose's raw signals: `isScrollInProgress` (true while dragging or
  // animating to a snap target) plus drag interactions (start/stop/cancel).
  const isScrollInProgressRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastEmittedScrollStateRef = useRef<'idle' | 'dragging' | 'settling' | null>(null);
  const emitPageScrollStateIfChanged = (state: 'idle' | 'dragging' | 'settling') => {
    if (state === lastEmittedScrollStateRef.current) return;
    lastEmittedScrollStateRef.current = state;
    onPageScrollStateChanged?.(wrapNativeEvent({ pageScrollState: state }));
  };

  useImperativeHandle(
    ref,
    () => ({
      setPage: (page: number) => {
        pagerRef.current?.animateScrollToPage(page);
      },
      setPageWithoutAnimation: (page: number) => {
        pagerRef.current?.scrollToPage(page);
      },
      setScrollEnabled: setScrollEnabledState,
    }),
    []
  );

  const pages = Children.toArray(children)
    .filter((child): child is ReactElement => isValidElement(child))
    .map((child, index) => (
      <RNHostView key={child.key ?? String(index)} modifiers={[fillMaxSize()]}>
        {child}
      </RNHostView>
    ));

  const pageScrollHandler = useMemo(
    () => (onPageScroll ? buildOnPageScrollHandler(onPageScroll) : undefined),
    [onPageScroll]
  );

  // RN's `borderRadius` on the host View doesn't reliably clip Compose drawing,
  // so translate it into a Compose `clip` modifier that bounds the pager's
  // canvas. iOS doesn't need this — CALayer's `cornerRadius` + `masksToBounds`
  // already clip the SwiftUI tree.
  const pagerModifiers = [fillMaxSize()];
  const cornerShape = borderRadiusShape(style, layoutDirection === 'rtl');
  if (cornerShape) {
    pagerModifiers.push(clip(cornerShape));
  }

  return (
    <Host style={style ?? { flex: 1 }}>
      <HorizontalPager
        ref={pagerRef}
        initialPage={initialPage}
        userScrollEnabled={scrollEnabledState}
        reverseLayout={layoutDirection === 'rtl'}
        pageSpacing={pageMargin}
        beyondViewportPageCount={offscreenPageLimit}
        modifiers={pagerModifiers}
        onSettledPageChange={(page) => {
          onPageSelected?.(wrapNativeEvent({ position: page }));
        }}
        onPageScroll={pageScrollHandler}
        onScrollInProgressChange={
          onPageScrollStateChanged
            ? (inProgress) => {
                isScrollInProgressRef.current = inProgress;
                if (!inProgress) {
                  emitPageScrollStateIfChanged('idle');
                } else if (!isDraggingRef.current) {
                  emitPageScrollStateIfChanged('settling');
                }
              }
            : undefined
        }
        onDragInteraction={
          onPageScrollStateChanged
            ? (kind) => {
                if (kind === 'start') {
                  isDraggingRef.current = true;
                  emitPageScrollStateIfChanged('dragging');
                } else {
                  isDraggingRef.current = false;
                  emitPageScrollStateIfChanged(isScrollInProgressRef.current ? 'settling' : 'idle');
                }
              }
            : undefined
        }>
        {pages}
      </HorizontalPager>
    </Host>
  );
}

// Compose reports `(currentPage, fraction in [-0.5, 0.5))` around the
// currently-snapped page; pager-view reports `(position, offset in [0, 1))`
// anchored at the leading page. Translate by re-anchoring negative fractions
// onto the previous page.
function composePageToPageScroll(
  currentPage: number,
  currentPageOffsetFraction: number
): { position: number; offset: number } {
  'worklet';
  if (currentPageOffsetFraction >= 0) {
    return { position: currentPage, offset: currentPageOffsetFraction };
  }
  return { position: currentPage - 1, offset: 1 + currentPageOffsetFraction };
}

/**
 * Returns the right `HorizontalPager.onPageScroll` handler for the user's
 * callback. If the user passed a worklet, the wrapper is also a worklet so
 * the per-frame mapping runs on the UI runtime; otherwise the wrapper is a
 * regular JS function.
 */
function buildOnPageScrollHandler(
  userOnPageScroll: NonNullable<PagerViewProps['onPageScroll']>
): (currentPage: number, currentPageOffsetFraction: number) => void {
  if (worklets?.isWorkletFunction?.(userOnPageScroll)) {
    return (currentPage, currentPageOffsetFraction) => {
      'worklet';
      userOnPageScroll(
        wrapNativeEvent(composePageToPageScroll(currentPage, currentPageOffsetFraction))
      );
    };
  }
  return (currentPage, currentPageOffsetFraction) => {
    userOnPageScroll(
      wrapNativeEvent(composePageToPageScroll(currentPage, currentPageOffsetFraction))
    );
  };
}

/**
 * Translates RN border-radius style keys into a Compose `RoundedCornerShape`.
 * Accepts uniform `borderRadius` and the four physical-corner keys; both
 * physical (`borderTopLeftRadius` etc.) and logical (`borderTopStartRadius`
 * etc.) keys map onto Compose's start/end edges, with start/end swapped under
 * RTL so visual layout matches the parent. Asymmetric radii fall back to
 * uniform when only `borderRadius` is set. Returns `undefined` when there is
 * no clipping to apply.
 */
function borderRadiusShape(style: PagerViewProps['style'], rtl: boolean): BuiltinShape | undefined {
  const flat = StyleSheet.flatten(style) as Record<string, unknown> | undefined;
  if (!flat) return undefined;
  // Compose's `RoundedCornerShape` takes `Dp` (numeric), so we can only honor
  // numeric border-radius values here. RN also accepts strings like `'50%'`
  // and CSS-in-JS libs may emit them; those are dropped (no clip) — `__DEV__`
  // warns once so this isn't silent.
  const num = (key: string): number | undefined => {
    const v = flat[key];
    if (typeof v === 'number') return v > 0 ? v : undefined;
    if (__DEV__ && typeof v === 'string') {
      warnAboutStringBorderRadiusOnce(key, v);
    }
    return undefined;
  };
  const uniform = num('borderRadius');
  // Physical keys (LTR-relative) and logical keys (writing-direction-relative)
  // collapse onto start/end. In RTL, physical-left maps to end and right to start.
  const topLeft = num('borderTopLeftRadius');
  const topRight = num('borderTopRightRadius');
  const bottomLeft = num('borderBottomLeftRadius');
  const bottomRight = num('borderBottomRightRadius');
  const topStart = num('borderTopStartRadius') ?? (rtl ? topRight : topLeft);
  const topEnd = num('borderTopEndRadius') ?? (rtl ? topLeft : topRight);
  const bottomStart = num('borderBottomStartRadius') ?? (rtl ? bottomRight : bottomLeft);
  const bottomEnd = num('borderBottomEndRadius') ?? (rtl ? bottomLeft : bottomRight);
  const hasPerCorner =
    topStart != null || topEnd != null || bottomStart != null || bottomEnd != null;
  if (hasPerCorner) {
    const fallback = uniform ?? 0;
    return Shapes.RoundedCorner({
      topStart: topStart ?? fallback,
      topEnd: topEnd ?? fallback,
      bottomStart: bottomStart ?? fallback,
      bottomEnd: bottomEnd ?? fallback,
    });
  }
  if (uniform != null) {
    return Shapes.RoundedCorner(uniform);
  }
  return undefined;
}

let didWarnStringBorderRadius = false;
function warnAboutStringBorderRadiusOnce(key: string, value: string): void {
  if (didWarnStringBorderRadius) return;
  didWarnStringBorderRadius = true;
  console.warn(
    `[expo-ui PagerView] ${key}: ${JSON.stringify(value)} — string border-radius values ` +
      `aren't supported on the Android pager (Jetpack Compose's RoundedCornerShape requires ` +
      `numeric Dp values). The corner radius is being dropped, so the pager won't clip. ` +
      `Use a numeric pixel value, or omit the style key.`
  );
}
