import { css } from '@emotion/react';
import {
  breakpoints,
  theme,
  iconSize,
  spacing,
  typography,
  ChevronDownIcon,
} from '@expo/styleguide';
import React from 'react';

import { BOLD, LinkBase } from '~/ui/components/Text';
import { ExpoLogoIcon } from '~/ui/foundations/icons';

export const Logo = () => (
  <LinkBase css={linkStyle} href="/">
    <div css={logoStyle}>
      <ExpoLogoIcon fill={theme.text.default} />
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
  margin-right: ${spacing[2]}px;
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
