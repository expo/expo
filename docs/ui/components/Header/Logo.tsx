import { css } from '@emotion/react';
import {
  breakpoints,
  theme,
  iconSize,
  spacing,
  typography,
  ChevronDownIcon,
  Logo as LogoIcon,
} from '@expo/styleguide';
import React from 'react';

import { BOLD, LinkBase } from '~/ui/components/Text';

export const Logo = () => (
  <LinkBase css={linkStyle} href="/">
    <div css={logoStyle}>
      <LogoIcon color={theme.text.default} style={{ height: 20 }} />
    </div>
    <BOLD css={titleStyle}>Expo</BOLD>
    <ChevronDownIcon size={iconSize.regular} css={chevronStyle} color={theme.icon.secondary} />
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
  padding-top: 2px;
  margin-right: ${spacing[1.5]}px;
`;

const chevronStyle = css`
  transform: rotate(-90deg);
  margin: 0 ${spacing[2]}px;

  @media screen and (max-width: ${breakpoints.medium}px) {
    margin-left: ${spacing[0.5]}px;
  }
`;

const titleStyle = css`
  ${typography.fontSizes[20]}

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }
`;

const subtitleStyle = css`
  color: ${theme.text.default};
  ${typography.fontSizes[18]}
`;
