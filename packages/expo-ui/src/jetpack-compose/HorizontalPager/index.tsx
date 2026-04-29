import { requireNativeView } from 'expo';

import {
  COMMAND_STATE_SYMBOL,
  type PagerNativeState,
  usePagerNativeState,
} from './usePagerNativeState';
import { getStateId } from '../../State/utils';
import { type ModifierConfig, type ViewEvent } from '../../types';
import type { PaddingValuesRecord } from '../Carousel';
import { createViewModifierEventListener } from '../modifiers/utils';

export { usePagerNativeState, type PagerNativeState };

export type HorizontalPagerProps = {
  /**
   * Pager state created with `usePagerNativeState`. Pass it to drive the pager from
   * JS (`state.animateScrollToPage(...)`) or read its current page reactively
   * (`state.currentPage.value`). If omitted, the pager mounts at page 0 and is
   * driven only by user swipes — use `onPageSelected` to observe.
   */
  state?: PagerNativeState;
  /**
   * Called when the settled page changes after a user swipe.
   */
  onPageSelected?: (position: number) => void;
  /**
   * Spacing between pages in dp.
   * @default 0
   */
  pageSpacing?: number;
  /**
   * Padding for pager content (dp or per-side object).
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

type NativeHorizontalPagerProps = Omit<HorizontalPagerProps, 'onPageSelected' | 'state'> &
  ViewEvent<'onPageSelected', { position: number }> & {
    currentPageState: number | null;
    commandState: number | null;
  };

const NativeView: React.ComponentType<NativeHorizontalPagerProps> = requireNativeView(
  'ExpoUI',
  'HorizontalPagerView'
);

function transformProps(props: HorizontalPagerProps): NativeHorizontalPagerProps {
  const { modifiers, onPageSelected, state, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    currentPageState: getStateId(state?.currentPage),
    commandState: getStateId(state?.[COMMAND_STATE_SYMBOL]),
    onPageSelected: onPageSelected
      ? ({ nativeEvent: { position } }) => onPageSelected(position)
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
