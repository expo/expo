import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { breakpoints } from '~/ui/foundations/breakpoints';

type MenuColumnProps = PropsWithChildren<object>;

export const MenuColumn = ({ children, ...rest }: MenuColumnProps) => (
  <div css={containerStyle} {...rest}>
    {children}
  </div>
);

const containerStyle = css`
  flex-shrink: 0;
  flex-basis: 288px;
  width: 288px; /* max-width: 288px; */
  height: 100%;
  overflow: hidden;
  transition: 200ms ease max-width;
  background: ${theme.background.canvas};

  @media screen and (max-width: ${breakpoints.max}px) {
    flex-basis: 288px;
    max-width: 288px;
  }

  @media screen and (max-width: ${breakpoints.mobile}px) {
    display: none;
  }
`;
