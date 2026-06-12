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
import { StyleSheet, View } from 'react-native';

import { wrapNativeEvent, type PagerViewProps } from './types';
import { worklets } from '../../State';
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
    ...passthrough
  } = props;

  const pagerRef = useRef<HorizontalPagerHandle>(null);
  const [scrollEnabledState, setScrollEnabledState] = useState(scrollEnabled);
  useEffect(() => {
    setScrollEnabledState(scrollEnabled);
  }, [scrollEnabled]);

  // The pages overlap (see the absolute positioning below), so gate touches to
  // the settled page; the rest are `pointerEvents="none"` so taps resolve to the
  // page on screen (#46386).
  const [settledPage, setSettledPage] = useState(initialPage);

  // Synthesize pager-view's `idle | dragging | settling` from Compose's raw
  // signals: `isScrollInProgress` (drag or snap-animation in flight) plus
  // drag interactions (start/stop/cancel).
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
      <RNHostView
        key={child.key ?? String(index)}
        // Overlap pages at one origin so each page's RN shadow position matches
        // where Compose draws it; otherwise `measure()`-based hit-testing
        // (e.g. `Pressable`) misfires on pages after the first (#46386).
        style={StyleSheet.absoluteFill}
        modifiers={[fillMaxSize()]}>
        <View style={styles.page} pointerEvents={index === settledPage ? 'auto' : 'none'}>
          {child}
        </View>
      </RNHostView>
    ));

  const pageScrollHandler = useMemo(
    () => (onPageScroll ? buildOnPageScrollHandler(onPageScroll) : undefined),
    [onPageScroll]
  );

  // RN's `borderRadius` on the host View doesn't reliably clip Compose's draw
  // pass — translate it into a Compose `clip` modifier instead.
  const pagerModifiers = [fillMaxSize()];
  const cornerShape = borderRadiusShape(style, layoutDirection === 'rtl');
  if (cornerShape) {
    pagerModifiers.push(clip(cornerShape));
  }

  return (
    <Host style={style ?? { flex: 1 }} {...passthrough}>
      <HorizontalPager
        ref={pagerRef}
        initialPage={initialPage}
        userScrollEnabled={scrollEnabledState}
        reverseLayout={layoutDirection === 'rtl'}
        pageSpacing={pageMargin}
        beyondViewportPageCount={offscreenPageLimit}
        modifiers={pagerModifiers}
        onSettledPageChange={(page) => {
          setSettledPage(page);
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

// Compose's `(currentPage, fraction ∈ [-0.5, 0.5))` is anchored to the snapped
// page; pager-view's `(position, offset ∈ [0, 1))` is anchored to the leading
// page. Re-anchor negative fractions onto the previous page.
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

// Mirrors the worklet-ness of the user's callback so the per-frame mapping
// stays on the UI runtime when the user is also on it.
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

// Translates RN border-radius style keys to a Compose `RoundedCornerShape`.
// Physical (`borderTopLeftRadius`) and logical (`borderTopStartRadius`) keys
// collapse onto Compose's start/end edges, swapped under RTL.
function borderRadiusShape(style: PagerViewProps['style'], rtl: boolean): BuiltinShape | undefined {
  const flat = StyleSheet.flatten(style) as Record<string, unknown> | undefined;
  if (!flat) return undefined;
  // Compose `RoundedCornerShape` only takes Dp (numeric); RN's string values
  // like `'50%'` are dropped — `__DEV__` warns once so the no-clip isn't silent.
  const num = (key: string): number | undefined => {
    const v = flat[key];
    if (typeof v === 'number') return v > 0 ? v : undefined;
    if (__DEV__ && typeof v === 'string') {
      warnAboutStringBorderRadiusOnce(key, v);
    }
    return undefined;
  };
  const uniform = num('borderRadius');
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

const styles = StyleSheet.create({
  page: { flex: 1 },
});
