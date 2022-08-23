import { css } from '@emotion/react';
import { theme, breakpoints, HamburgerIcon, iconSize, spacing } from '@expo/styleguide';
import React, { useState } from 'react';

import { Logo } from './Logo';
import { ThemeSelector } from './ThemeSelector';

import { Button } from '~/ui/components/Button';
import { DocSearch } from '~/ui/components/Search';
import { BOLD } from '~/ui/components/Text';

export const Header = () => {
  const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);
  return (
    <>
      <nav css={containerStyle}>
        <div css={[columnStyle, leftColumnStyle]}>
          <Logo />
        </div>
        <div css={[columnStyle, rightColumnStyle]}>
          <DocSearch />
          <div css={hideOnMobileStyle}>
            <ThemeSelector />
          </div>
          <div css={showOnMobileStyle}>
            <Button
              theme="transparent"
              css={[mobileButtonStyle, isMobileMenuVisible && mobileButtonActiveStyle]}
              onClick={() => {
                setMobileMenuVisible(prevState => !prevState);
              }}>
              <HamburgerIcon size={iconSize.small} color={theme.icon.default} />
            </Button>
          </div>
        </div>
      </nav>
      {isMobileMenuVisible && (
        <nav css={[containerStyle, showOnMobileStyle]}>
          <div css={[columnStyle, leftColumnStyle]}>
            <BOLD>Theme</BOLD>
          </div>
          <div css={[columnStyle, rightColumnStyle]}>
            <ThemeSelector />
          </div>
        </nav>
      )}
    </>
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
  padding: 0 ${spacing[4]}px;
  height: 60px;
  box-sizing: border-box;
  border-bottom: 1px solid ${theme.border.default};
`;

const columnStyle = css`
  flex-shrink: 0;
  display: flex;
  background-color: transparent;
`;

const leftColumnStyle = css`
  flex-basis: 256px;
  width: 256px;

  @media screen and (max-width: ${breakpoints.medium}px) {
    flex-basis: auto;
    width: auto;
  }
`;

const rightColumnStyle = css`
  flex-basis: 288px;
  width: 288px;
  justify-content: flex-end;

  @media screen and (max-width: ${breakpoints.medium}px) {
    flex-basis: auto;
    width: auto;
  }
`;

const showOnMobileStyle = css`
  display: none;

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: flex;
  }
`;

const hideOnMobileStyle = css`
  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }
`;

const mobileButtonStyle = css`
  padding: 0 ${spacing[3]}px;
  margin-left: ${spacing[2]}px;

  &:hover {
    background-color: ${theme.background.tertiary};
    box-shadow: none;
  }
`;

const mobileButtonActiveStyle = css`
  background-color: ${theme.background.secondary};
`;
