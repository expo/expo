import { css } from '@emotion/react';
import {
  breakpoints,
  theme,
  spacing,
  typography,
  ChevronRightIcon,
  Logo as LogoIcon,
  WordMarkLogo,
} from '@expo/styleguide';
import React from 'react';

import { LinkBase } from '~/ui/components/Text';

export const Logo = () => (
  <>
    <LinkBase css={linkStyle} href="https://expo.dev" openInNewTab>
      <WordMarkLogo color={theme.text.default} css={[logoStyle, hideOnMobile]} />
      <LogoIcon color={theme.text.default} css={[logoStyle, showOnMobile]} />
    </LinkBase>
    <ChevronRightIcon css={chevronStyle} color={theme.icon.secondary} />
    <LinkBase css={linkStyle} href="/">
      <span css={subtitleStyle}>Docs</span>
    </LinkBase>
  </>
);

const linkStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-decoration: none;
  user-select: none;
`;

const logoStyle = css`
  height: 20px;
  margin-top: 1px;
`;

const chevronStyle = css`
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
    margin-top: 0;
    margin-right: ${spacing[1.5]}px;
  }
`;

const subtitleStyle = css`
  color: ${theme.text.default};
  ${typography.fontSizes[18]}
`;
