import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';

import { breakpoints } from '~/ui/foundations/breakpoints';

type TocColumnProps = PropsWithChildren<object>;

export const TocColumn = ({ children, ...rest }: TocColumnProps) => (
  <div css={containerStyle} {...rest}>
    {children}
  </div>
);

const containerStyle = css`
  flex-shrink: 0;
  flex-basis: 256px;
  width: 256px; /* max-width: 256px; */
  height: 100%;
  overflow: hidden;
  transition: 200ms ease max-width;
  background: ${theme.background.canvas};

  @media screen and (max-width: ${breakpoints.max}px) {
    flex-basis: 256px;
    max-width: 256px;
  }

  @media screen and (max-width: ${breakpoints.mobile}px) {
    display: none;
  }
`;
