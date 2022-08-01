import { css } from '@emotion/react';
import {
  breakpoints,
  theme,
  iconSize,
  spacing,
  typography,
  ChevronDownIcon,
  Logo as LogoIcon,
  WordMarkLogo,
} from '@expo/styleguide';
import React from 'react';

import { LinkBase } from '~/ui/components/Text';

export const Logo = () => (
  <LinkBase css={linkStyle} href="/">
    <WordMarkLogo color={theme.text.default} css={[logoStyle, hideOnMobile]} />
    <LogoIcon color={theme.text.default} css={[logoStyle, showOnMobile]} />
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
  height: 20px;
`;

const chevronStyle = css`
  transform: rotate(-90deg);
  margin: 0 ${spacing[2]}px;

  @media screen and (max-width: ${breakpoints.medium}px) {
    margin-left: ${spacing[0.5]}px;
  }
`;

const hideOnMobile = css`
  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }
`;

const showOnMobile = css`
  display: none;

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: block;
    margin-right: ${spacing[1.5]}px;
  }
`;

const subtitleStyle = css`
  color: ${theme.text.default};
  ${typography.fontSizes[18]}
`;
