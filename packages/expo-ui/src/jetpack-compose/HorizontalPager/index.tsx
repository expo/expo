import { requireNativeView } from 'expo';
import type { Ref } from 'react';

import { type ModifierConfig, type ViewEvent } from '../../types';
import type { PaddingValuesRecord } from '../Carousel';
import { createViewModifierEventListener } from '../modifiers/utils';

export type HorizontalPagerHandle = {
  /**
   * Mirrors Compose's `PagerState.animateScrollToPage`. Resolves when the
   * animation completes.
   */
  animateScrollToPage: (page: number) => Promise<void>;
  /**
   * Mirrors Compose's `PagerState.scrollToPage`. Jumps without animation.
   */
  scrollToPage: (page: number) => Promise<void>;
};

export type HorizontalPagerProps = {
  /**
   * Imperative handle for programmatic navigation. Mirrors the methods on
   * Compose's `PagerState`.
   */
  ref?: Ref<HorizontalPagerHandle>;
  /**
   * Page to mount on. Mirrors `rememberPagerState(initialPage = …)`. Subsequent
   * changes have no effect — use the ref methods to navigate after mount.
   * @default 0
   */
  initialPage?: number;
  /**
   * Fires when Compose's `PagerState.currentPage` changes — i.e. when the page
   * closest to the snap position flips, including mid-swipe as the user
   * crosses between pages.
   */
  onCurrentPageChange?: (page: number) => void;
  /**
   * Fires when Compose's `PagerState.settledPage` changes — i.e. after a
   * swipe or programmatic scroll has fully settled.
   */
  onSettledPageChange?: (page: number) => void;
  /**
   * Spacing between pages in dp.
   * @default 0
   */
  pageSpacing?: number;
  /**
   * Padding for pager content (dp or per-side object).
   * @default 0
   */
  contentPadding?: number | PaddingValuesRecord;
  /**
   * Whether the user can scroll the pager by swiping.
   * @default true
   */
  userScrollEnabled?: boolean;
  /**
   * Whether to reverse the layout direction.
   * @default false
   */
  reverseLayout?: boolean;
  /**
   * Number of pages to compose and keep beyond the visible viewport.
   * @default 0
   */
  beyondViewportPageCount?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children to render as pages.
   */
  children: React.ReactNode;
};

type NativeHorizontalPagerProps = Omit<
  HorizontalPagerProps,
  'onCurrentPageChange' | 'onSettledPageChange'
> &
  ViewEvent<'onCurrentPageChange', { position: number }> &
  ViewEvent<'onSettledPageChange', { position: number }>;

const NativeView: React.ComponentType<NativeHorizontalPagerProps> = requireNativeView(
  'ExpoUI',
  'HorizontalPagerView'
);

function transformProps(props: HorizontalPagerProps): NativeHorizontalPagerProps {
  const { modifiers, onCurrentPageChange, onSettledPageChange, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onCurrentPageChange: onCurrentPageChange
      ? ({ nativeEvent: { position } }) => onCurrentPageChange(position)
      : undefined,
    onSettledPageChange: onSettledPageChange
      ? ({ nativeEvent: { position } }) => onSettledPageChange(position)
      : undefined,
  };
}

/**
 * A horizontally scrolling pager that snaps to individual pages,
 * matching Compose's `HorizontalPager`.
 */
export function HorizontalPager(props: HorizontalPagerProps) {
  return <NativeView {...transformProps(props)} />;
}
