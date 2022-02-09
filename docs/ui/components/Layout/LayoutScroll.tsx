import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { HTMLAttributes, PropsWithChildren } from 'react';

type LayoutScrollProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function LayoutScroll({ children, ...rest }: LayoutScrollProps) {
  return (
    <div css={scrollStyle} {...rest}>
      {children}
    </div>
  );
}

const scrollStyle = css({
  height: '100%',
  scrollBehavior: 'smooth',
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
