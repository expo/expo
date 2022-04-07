import { css } from '@emotion/react';
import { theme, breakpoints, SearchIcon, iconSize, spacing } from '@expo/styleguide';
import React, { useState } from 'react';

import { Logo } from './Logo';
import { Search } from './Search';
import { ThemeSelector } from './ThemeSelector';

import { Button } from '~/ui/components/Button';
import { BOLD } from '~/ui/components/Text';
import { MenuIcon } from '~/ui/foundations/icons';

export const Header = () => {
  const [isMobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);
  return (
    <>
      <nav css={containerStyle}>
        <div css={[columnStyle, leftColumnStyle]}>
          <Logo />
        </div>
        <Search version="latest" css={hideOnMobileStyle} />
        <div css={[columnStyle, rightColumnStyle, hideOnMobileStyle]}>
          <ThemeSelector />
        </div>
        <div css={[columnStyle, rightColumnStyle, showOnMobileStyle]}>
          <Button
            theme="transparent"
            css={[mobileButtonStyle, isMobileSearchVisible && mobileButtonActiveStyle]}
            onClick={() => {
              setMobileMenuVisible(false);
              setMobileSearchVisible(prevState => !prevState);
            }}>
            <SearchIcon size={iconSize.small} color={theme.icon.default} />
          </Button>
          <Button
            theme="transparent"
            css={[mobileButtonStyle, isMobileMenuVisible && mobileButtonActiveStyle]}
            onClick={() => {
              setMobileSearchVisible(false);
              setMobileMenuVisible(prevState => !prevState);
            }}>
            <MenuIcon />
          </Button>
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
      {isMobileSearchVisible && (
        <nav css={[containerStyle, showOnMobileStyle]}>
          <Search mobile version="latest" css={mobileSearchInputStyle} />
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
  }
`;

const mobileButtonActiveStyle = css`
  background-color: ${theme.background.secondary};
`;

const mobileSearchInputStyle = css`
  margin: 0;
`;
