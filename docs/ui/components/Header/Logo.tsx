import { css } from '@emotion/react';
import {
  breakpoints,
  theme,
  spacing,
  typography,
  Logo as LogoIcon,
  WordMarkLogo,
  borderRadius,
} from '@expo/styleguide';
import React from 'react';

import { H4, LinkBase } from '~/ui/components/Text';

export const Logo = () => (
  <div css={containerStyle}>
    <LinkBase css={linkStyle} href="https://expo.dev">
      <WordMarkLogo color={theme.text.default} css={[logoStyle, hideOnMobile]} />
      <LogoIcon color={theme.text.default} css={[logoStyle, showOnMobile]} />
    </LinkBase>
    {/* <ChevronRightIcon size={iconSize.small} color={theme.icon.secondary} /> */}
    <LinkBase css={linkStyle} href="/">
      <H4 weight="medium" css={subtitleStyle}>
        Docs
      </H4>
    </LinkBase>
  </div>
);

const containerStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2.5],
});

const linkStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-decoration: none;
  user-select: none;
`;

const logoStyle = css`
  height: ${spacing[5]}px;
  margin-top: 1px;
`;

const hideOnMobile = css`
  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    display: none;
  }
`;

const showOnMobile = css`
  display: none;

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    display: block;
    margin-top: 0;
  }
`;

const subtitleStyle = css`
  ${typography.fontSizes[15]};
  background-color: ${theme.palette.primary[100]};
  color: ${theme.palette.primary[900]};
  padding: ${spacing[0]}px ${spacing[3]}px;
  border-radius: ${borderRadius.medium}px;
`;
