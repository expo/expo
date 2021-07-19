import { css } from '@emotion/react';
import React from 'react';

import { SDK } from '~/components/icons/SDK'; // todo
import { Link } from '~/ui/components/Link';
import { P, BOLD } from '~/ui/components/Text';

export const Logo = () => (
  <div css={containerStyle}>
    <Link css={linkStyle} href="/" style={{ marginRight: 8 }}>
      <SDK />
    </Link>
    <Link css={linkStyle} href="/">
      <P size="large">
        <BOLD>Expo</BOLD> / docs
      </P>
    </Link>
  </div>
);

const containerStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const linkStyle = css`
  color: inherit;
  text-decoration: none;
`;
