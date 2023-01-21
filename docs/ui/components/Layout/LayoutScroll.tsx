import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { forwardRef, HTMLAttributes, PropsWithChildren } from 'react';

type LayoutScrollProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    /**
     * If the scroll container should smoothly scroll when scrolled programmatically.
     */
    smoothScroll?: boolean;
    /**
     * If the overscoll effect should be disabled.
     */
    disableOverscroll?: boolean;
  }
>;

export const LayoutScroll = forwardRef<HTMLDivElement, LayoutScrollProps>(
  ({ smoothScroll = true, disableOverscroll = true, children, ...rest }, ref) => (
    <div
      css={[
        scrollStyle,
        smoothScroll && smoothScrollBehavior,
        disableOverscroll && disableOverscrollBehavior,
      ]}
      {...rest}
      ref={ref}>
      {children}
    </div>
  )
);

const scrollStyle = css({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  /**
   * Scrollbar
   */
  '::-webkit-scrollbar': {
    width: '6px',
  },
  // Track
  '::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  // Handle
  '::-webkit-scrollbar-thumb': {
    backgroundColor: theme.background.element,
    borderRadius: '10px',
  },
  // Handle on hover
  '::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.background.hover,
  },
});

const smoothScrollBehavior = css({
  scrollBehavior: 'smooth',
});

const disableOverscrollBehavior = css({
  overscrollBehavior: 'contain',
});
