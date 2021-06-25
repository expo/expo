import { css } from '@emotion/react';
import React from 'react';

import { TocLink } from './TocLink';

import { LABEL } from '~/ui/components/Text';
import { TocColumn } from '~/ui/containers/document';

export const Toc = () => (
  <TocColumn>
    <nav css={containerStyle} aria-labelledby="toc-title">
      <LABEL>On this page</LABEL>
      <TocLink href="#">Expo CLI</TocLink>
    </nav>
  </TocColumn>
);

const containerStyle = css`
  padding: 3rem 2rem;
`;
