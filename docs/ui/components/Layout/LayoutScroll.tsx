import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { forwardRef, HTMLAttributes, PropsWithChildren } from 'react';

type LayoutScrollProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    /** If the scroll container should smoothly scroll when scrolled programatically */
    smoothScroll?: boolean;
  }
>;

export const LayoutScroll = forwardRef<HTMLDivElement, LayoutScrollProps>(
  ({ smoothScroll, children, ...rest }, ref) => (
    <div css={[scrollStyle, smoothScroll && smoothScrollBehavior]} {...rest} ref={ref}>
      {children}
    </div>
  )
);

const scrollStyle = css({
  height: '100%',
  overflowY: 'auto',
  /* width */
  '::-webkit-scrollbar': {
    width: '6px',
  },
  /* Track */
  '::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  /* Handle */
  '::-webkit-scrollbar-thumb': {
    backgroundColor: theme.background.tertiary,
    borderRadius: '10px',
  },
  /* Handle on hover */
  '::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.background.quaternary,
  },
});

const smoothScrollBehavior = css({
  scrollBehavior: 'smooth',
});
