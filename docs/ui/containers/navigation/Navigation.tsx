import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React from 'react';

import { Logo } from './Logo';
import { Theme } from './Theme';

import AlgoliaSearch from '~/components/plugins/AlgoliaSearch'; // todo
import { MenuColumn, TocColumn } from '~/ui/containers/Document';
import { breakpoints } from '~/ui/foundations/breakpoints';

export const Navigation = () => {
  return (
    <nav css={containerStyle}>
      <MenuColumn css={columnStyle}>
        <Logo />
      </MenuColumn>
      <AlgoliaSearch version="latest" hiddenOnMobile />
      <TocColumn css={[columnStyle, { justifyContent: 'flex-end' }]}>
        <Theme />
      </TocColumn>
    </nav>
  );
};

const containerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background-color: ${theme.background.default};
  z-index: 2;
  margin: 0 auto;
  padding: 0 1rem;
  height: 60px;
  box-sizing: unset;

  /* @media screen and (max-width: ${breakpoints.mobile}px) {
    border-bottom: 1px solid ${theme.border.default};
  } */
`;

const columnStyle = css`
  display: flex;
  align-items: center;
  background-color: transparent;
`;
