import { css } from '@emotion/react';
import { breakpoints, theme, iconSize, ChevronDownIcon } from '@expo/styleguide';
import React from 'react';

import { BOLD, LinkBase } from '~/ui/components/Text';
import { ExpoLogoIcon } from '~/ui/foundations/icons';

export const Logo = () => (
  <LinkBase css={linkStyle} href="/">
    <div css={logoStyle}>
      <ExpoLogoIcon />
    </div>
    <BOLD css={titleStyle}>Expo</BOLD>
    <ChevronDownIcon size={iconSize.small} css={chevronStyle} color={theme.icon.secondary} />
    <span css={subtitleStyle}>Docs</span>
  </LinkBase>
);

const linkStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-decoration: none;
`;

const logoStyle = css`
  float: left;
  margin: 2px 8px 0 0;
`;

const chevronStyle = css`
  transform: rotate(-90deg);
  color: ${theme.icon.secondary};
  margin: 0 8px;

  @media screen and (max-width: ${breakpoints.medium}px) {
    margin-left: 2px;
  }
`;

const titleStyle = css`
  font-size: 1.25rem;

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }
`;

const subtitleStyle = css`
  font-size: 1.1rem;
  color: ${theme.text.default};
`;
